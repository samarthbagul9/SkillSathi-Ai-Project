using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkillSathiAPI.Data;
using SkillSathiAPI.DTOs;
using SkillSathiAPI.Entities;

namespace SkillSathiAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ProfileController> _logger;

        public ProfileController(
            AppDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<ProfileController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        // GET: api/profile/student
        [HttpGet("student")]
        public async Task<IActionResult> GetStudentProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || user.UserType != "Student")
                return BadRequest(new { Message = "User is not a student or not found." });

            // Eagerly load the profile, skills, and resume
            var profile = await _context.StudentProfiles
                .Include(s => s.StudentSkills)
                    .ThenInclude(ss => ss.Skill)
                .Include(s => s.Resume)
                .FirstOrDefaultAsync(s => s.Id == userId);

            // Auto-create profile if it doesn't exist (robust UX)
            if (profile == null)
            {
                profile = new StudentProfile
                {
                    Id = userId,
                    UserId = userId,
                    TargetJobTitle = "Software Engineer" // default placeholder
                };
                _context.StudentProfiles.Add(profile);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created new empty StudentProfile for user: {UserId}", userId);
            }

            var dto = MapToStudentDTO(user, profile);
            return Ok(dto);
        }

        // PUT: api/profile/student
        [HttpPut("student")]
        public async Task<IActionResult> UpdateStudentProfile([FromBody] UpdateStudentProfileRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var profile = await _context.StudentProfiles.FirstOrDefaultAsync(s => s.Id == userId);
            if (profile == null)
            {
                return NotFound(new { Message = "Student profile not found." });
            }

            profile.Bio = request.Bio;
            profile.EducationDetails = request.EducationDetails;
            profile.TargetJobTitle = request.TargetJobTitle;
            profile.LinkedIn = request.LinkedIn;
            profile.Github = request.Github;

            _context.Entry(profile).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated StudentProfile for user: {UserId}", userId);
            return Ok(new { Message = "Profile updated successfully." });
        }

        // GET: api/profile/recruiter
        [HttpGet("recruiter")]
        public async Task<IActionResult> GetRecruiterProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || user.UserType != "Recruiter")
                return BadRequest(new { Message = "User is not a recruiter or not found." });

            var profile = await _context.RecruiterProfiles.FirstOrDefaultAsync(r => r.Id == userId);

            // Auto-create profile if it doesn't exist
            if (profile == null)
            {
                profile = new RecruiterProfile
                {
                    Id = userId,
                    UserId = userId,
                    CompanyName = "My Company"
                };
                _context.RecruiterProfiles.Add(profile);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created new empty RecruiterProfile for user: {UserId}", userId);
            }

            var dto = new RecruiterProfileDTO
            {
                Id = profile.Id,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                CompanyName = profile.CompanyName,
                CompanyWebsite = profile.CompanyWebsite,
                CompanyBio = profile.CompanyBio
            };

            return Ok(dto);
        }

        // PUT: api/profile/recruiter
        [HttpPut("recruiter")]
        public async Task<IActionResult> UpdateRecruiterProfile([FromBody] UpdateRecruiterProfileRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var profile = await _context.RecruiterProfiles.FirstOrDefaultAsync(r => r.Id == userId);
            if (profile == null)
            {
                return NotFound(new { Message = "Recruiter profile not found." });
            }

            profile.CompanyName = request.CompanyName;
            profile.CompanyWebsite = request.CompanyWebsite;
            profile.CompanyBio = request.CompanyBio;

            _context.Entry(profile).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated RecruiterProfile for user: {UserId}", userId);
            return Ok(new { Message = "Company profile updated successfully." });
        }

        // GET: api/profile/student/{id} (Public/Recruiter view)
        [HttpGet("student/{id}")]
        public async Task<IActionResult> GetPublicStudentProfile(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null || user.UserType != "Student")
                return NotFound(new { Message = "Student not found." });

            var profile = await _context.StudentProfiles
                .Include(s => s.StudentSkills)
                    .ThenInclude(ss => ss.Skill)
                .Include(s => s.Resume)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (profile == null)
                return NotFound(new { Message = "Student profile not found." });

            var dto = MapToStudentDTO(user, profile);
            return Ok(dto);
        }

        private StudentProfileDTO MapToStudentDTO(ApplicationUser user, StudentProfile profile)
        {
            return new StudentProfileDTO
            {
                Id = profile.Id,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                Bio = profile.Bio,
                EducationDetails = profile.EducationDetails,
                TargetJobTitle = profile.TargetJobTitle,
                LinkedIn = profile.LinkedIn,
                Github = profile.Github,
                ResumeFileName = profile.Resume?.FileName,
                ResumeAtsScore = profile.Resume?.AtsScore,
                Skills = profile.StudentSkills.Select(ss => new StudentSkillDTO
                {
                    SkillId = ss.SkillId,
                    SkillName = ss.Skill.Name,
                    Category = ss.Skill.Category,
                    ProficiencyLevel = ss.ProficiencyLevel
                }).ToList()
            };
        }
    }
}
