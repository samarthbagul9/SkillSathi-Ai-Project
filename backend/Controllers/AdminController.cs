using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SkillSathiAPI.Data;
using SkillSathiAPI.DTOs;
using SkillSathiAPI.Entities;

namespace SkillSathiAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            AppDbContext context,
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            ILogger<AdminController> logger)
        {
            _context = context;
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<AdminDashboardStats>> GetStats()
        {
            try
            {
                _logger.LogInformation("Admin stats requested.");

                // 1. Core counts
                var totalUsers = await _userManager.Users.CountAsync();
                var totalStudents = await _context.StudentProfiles.CountAsync();
                var totalRecruiters = await _context.RecruiterProfiles.CountAsync();
                var totalJobs = await _context.Jobs.CountAsync();
                var activeJobs = await _context.Jobs.CountAsync(j => j.IsActive);
                var totalApplications = await _context.JobApplications.CountAsync();

                // 2. Application status metrics
                var appliedCount = await _context.JobApplications.CountAsync(a => a.Status == "Applied");
                var shortlistedCount = await _context.JobApplications.CountAsync(a => a.Status == "Shortlisted");
                var rejectedCount = await _context.JobApplications.CountAsync(a => a.Status == "Rejected");

                // 3. Database connection and type detection
                var dbType = _context.Database.ProviderName?.Contains("Sqlite") == true 
                    ? "SQLite (Local Dev)" 
                    : "SQL Server (Production)";

                // 4. AI Gemini API configuration status
                var apiKey = _configuration["Gemini:ApiKey"];
                var geminiStatus = (string.IsNullOrEmpty(apiKey) || apiKey == "YOUR_GEMINI_API_KEY_HERE" || apiKey.Length < 10)
                    ? "Offline / Mock Mode"
                    : "Online / Live Mode";

                // 5. Popular skills distribution among students
                var popularSkills = await _context.StudentSkills
                    .Include(ss => ss.Skill)
                    .GroupBy(ss => ss.Skill.Name)
                    .Select(g => new SkillStat
                    {
                        SkillName = g.Key,
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.Count)
                    .Take(5)
                    .ToListAsync();

                var stats = new AdminDashboardStats
                {
                    TotalUsers = totalUsers,
                    TotalStudents = totalStudents,
                    TotalRecruiters = totalRecruiters,
                    TotalJobs = totalJobs,
                    ActiveJobs = activeJobs,
                    TotalApplications = totalApplications,
                    AppliedApplications = appliedCount,
                    ShortlistedApplications = shortlistedCount,
                    RejectedApplications = rejectedCount,
                    DatabaseType = dbType,
                    GeminiStatus = geminiStatus,
                    PopularSkills = popularSkills
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching admin stats");
                return StatusCode(500, new { Message = "An error occurred while fetching system stats.", Details = ex.Message });
            }
        }

        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<AdminUserListItem>>> GetUsers()
        {
            try
            {
                _logger.LogInformation("Admin users list requested.");

                var users = await _userManager.Users.ToListAsync();
                
                // Fetch profiles in-memory to safely map to DTOs without EF Core translation limits
                var studentProfiles = await _context.StudentProfiles
                    .Include(s => s.Resume)
                    .ToDictionaryAsync(s => s.Id);

                var recruiterProfiles = await _context.RecruiterProfiles
                    .ToDictionaryAsync(r => r.Id);

                var list = new List<AdminUserListItem>();
                foreach (var u in users)
                {
                    string extraInfo = "System Administrator";
                    if (u.UserType == "Student")
                    {
                        if (studentProfiles.TryGetValue(u.Id, out var student))
                        {
                            var target = string.IsNullOrEmpty(student.TargetJobTitle) ? "Not Set" : student.TargetJobTitle;
                            var score = student.Resume != null ? $"{student.Resume.AtsScore}/100" : "No Resume";
                            extraInfo = $"Target: {target} (ATS: {score})";
                        }
                        else
                        {
                            extraInfo = "Student (Profile Incomplete)";
                        }
                    }
                    else if (u.UserType == "Recruiter")
                    {
                        if (recruiterProfiles.TryGetValue(u.Id, out var recruiter))
                        {
                            var company = string.IsNullOrEmpty(recruiter.CompanyName) ? "Not Set" : recruiter.CompanyName;
                            extraInfo = $"Company: {company}";
                        }
                        else
                        {
                            extraInfo = "Recruiter (Profile Incomplete)";
                        }
                    }

                    list.Add(new AdminUserListItem
                    {
                        Id = u.Id,
                        FullName = u.FullName,
                        Email = u.Email ?? string.Empty,
                        UserType = u.UserType,
                        CreatedAt = u.CreatedAt,
                        IsActive = u.IsActive,
                        ExtraInfo = extraInfo
                    });
                }

                // Return sorted list (newest first, admins at top)
                var sortedList = list
                    .OrderByDescending(x => x.UserType == "Admin")
                    .ThenByDescending(x => x.CreatedAt)
                    .ToList();

                return Ok(sortedList);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching admin users");
                return StatusCode(500, new { Message = "An error occurred while fetching users.", Details = ex.Message });
            }
        }

        [HttpPost("users/{id}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(string id)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (currentUserId == id)
                {
                    return BadRequest(new { Message = "You cannot suspend your own administrator account." });
                }

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { Message = "User not found." });
                }

                user.IsActive = !user.IsActive;
                var result = await _userManager.UpdateAsync(user);

                if (!result.Succeeded)
                {
                    return BadRequest(new { Message = "Failed to update user status.", Errors = result.Errors.Select(e => e.Description) });
                }

                _logger.LogInformation("Admin toggled status for user {Email} to IsActive={Status}", user.Email, user.IsActive);
                return Ok(new { Message = $"User account has been {(user.IsActive ? "activated" : "suspended")} successfully.", IsActive = user.IsActive });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling user status for {UserId}", id);
                return StatusCode(500, new { Message = "An error occurred while updating user status.", Details = ex.Message });
            }
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (currentUserId == id)
                {
                    return BadRequest(new { Message = "You cannot delete your own administrator account." });
                }

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { Message = "User not found." });
                }

                _logger.LogInformation("Admin is deleting user {Email}", user.Email);

                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(new { Message = "Failed to delete user.", Errors = result.Errors.Select(e => e.Description) });
                }

                return Ok(new { Message = "User account and all associated profile records have been deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", id);
                return StatusCode(500, new { Message = "An error occurred while deleting the user.", Details = ex.Message });
            }
        }
    }
}
