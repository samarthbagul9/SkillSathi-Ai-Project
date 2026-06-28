using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkillSathiAPI.Data;
using SkillSathiAPI.DTOs;
using SkillSathiAPI.Entities;
using Microsoft.AspNetCore.SignalR;
using SkillSathiAPI.Hubs;

namespace SkillSathiAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class JobsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<JobsController> _logger;
        private readonly IHubContext<NotificationHub> _notificationHubContext;

        public JobsController(
            AppDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<JobsController> _logger,
            IHubContext<NotificationHub> notificationHubContext)
        {
            _context = context;
            _userManager = userManager;
            this._logger = _logger;
            _notificationHubContext = notificationHubContext;
        }

        // ==================== STUDENT / PUBLIC ENDPOINTS ====================

        // GET: api/jobs (Search and filter jobs)
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetJobs([FromQuery] string? search, [FromQuery] string? location, [FromQuery] string? jobType)
        {
            var query = _context.Jobs
                .Include(j => j.RecruiterProfile)
                .Where(j => j.IsActive)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(j => j.Title.ToLower().Contains(lowerSearch) || 
                                         j.Description.ToLower().Contains(lowerSearch));
            }

            if (!string.IsNullOrEmpty(location))
            {
                query = query.Where(j => j.Location.ToLower() == location.ToLower());
            }

            if (!string.IsNullOrEmpty(jobType))
            {
                query = query.Where(j => j.JobType.ToLower() == jobType.ToLower());
            }

            var jobs = await query
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new JobDTO
                {
                    Id = j.Id,
                    RecruiterId = j.RecruiterProfileId,
                    CompanyName = j.RecruiterProfile.CompanyName,
                    CompanyWebsite = j.RecruiterProfile.CompanyWebsite,
                    Title = j.Title,
                    Description = j.Description,
                    Requirements = j.Requirements,
                    Location = j.Location,
                    SalaryRange = j.SalaryRange,
                    JobType = j.JobType,
                    IsActive = j.IsActive,
                    CreatedAt = j.CreatedAt,
                    ApplicationsCount = j.Applications.Count
                })
                .ToListAsync();

            return Ok(jobs);
        }

        // GET: api/jobs/{id} (Job details)
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetJobDetails(int id)
        {
            var job = await _context.Jobs
                .Include(j => j.RecruiterProfile)
                .FirstOrDefaultAsync(j => j.Id == id);

            if (job == null)
                return NotFound(new { Message = "Job posting not found." });

            var dto = new JobDTO
            {
                Id = job.Id,
                RecruiterId = job.RecruiterProfileId,
                CompanyName = job.RecruiterProfile.CompanyName,
                CompanyWebsite = job.RecruiterProfile.CompanyWebsite,
                Title = job.Title,
                Description = job.Description,
                Requirements = job.Requirements,
                Location = job.Location,
                SalaryRange = job.SalaryRange,
                JobType = job.JobType,
                IsActive = job.IsActive,
                CreatedAt = job.CreatedAt,
                ApplicationsCount = await _context.JobApplications.CountAsync(a => a.JobId == id)
            };

            return Ok(dto);
        }

        // POST: api/jobs/{id}/apply (Apply for job)
        [HttpPost("{id}/apply")]
        public async Task<IActionResult> ApplyForJob(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || user.UserType != "Student")
                return BadRequest(new { Message = "Only students can apply for jobs." });

            // Verify if student profile exists
            var studentProfile = await _context.StudentProfiles.FirstOrDefaultAsync(s => s.Id == userId);
            if (studentProfile == null)
            {
                return BadRequest(new { Message = "Please set up your student profile before applying." });
            }

            // Check if job exists
            var job = await _context.Jobs.FindAsync(id);
            if (job == null || !job.IsActive)
                return NotFound(new { Message = "Active job posting not found." });

            // Check for duplicate application
            var existingApplication = await _context.JobApplications
                .FirstOrDefaultAsync(a => a.JobId == id && a.StudentProfileId == userId);

            if (existingApplication != null)
                return BadRequest(new { Message = "You have already applied for this job." });

            var application = new JobApplication
            {
                JobId = id,
                StudentProfileId = userId,
                AppliedAt = DateTime.UtcNow,
                Status = "Applied"
            };

            _context.JobApplications.Add(application);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Student {UserId} successfully applied for Job {JobId}", userId, id);
            return Ok(new { Message = "Application submitted successfully.", ApplicationId = application.Id });
        }

        // GET: api/jobs/applications (List student's applications)
        [HttpGet("applications")]
        public async Task<IActionResult> GetStudentApplications()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var applications = await _context.JobApplications
                .Include(a => a.Job)
                    .ThenInclude(j => j.RecruiterProfile)
                .Where(a => a.StudentProfileId == userId)
                .OrderByDescending(a => a.AppliedAt)
                .Select(a => new JobApplicationDTO
                {
                    ApplicationId = a.Id,
                    JobId = a.JobId,
                    JobTitle = a.Job.Title,
                    CompanyName = a.Job.RecruiterProfile.CompanyName,
                    Location = a.Job.Location,
                    JobType = a.Job.JobType,
                    AppliedAt = a.AppliedAt,
                    Status = a.Status,
                    AiMatchScore = a.AiMatchScore,
                    Feedback = a.Feedback,
                    RecruiterId = a.Job.RecruiterProfileId
                })
                .ToListAsync();

            return Ok(applications);
        }

        // ==================== RECRUITER ENDPOINTS ====================

        // POST: api/jobs (Post a new job)
        [HttpPost]
        public async Task<IActionResult> PostJob([FromBody] CreateJobRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || user.UserType != "Recruiter")
                return BadRequest(new { Message = "Only recruiters can post jobs." });

            // Verify recruiter profile exists
            var recruiterProfile = await _context.RecruiterProfiles.FirstOrDefaultAsync(r => r.Id == userId);
            if (recruiterProfile == null)
            {
                return BadRequest(new { Message = "Please configure your recruiter profile first." });
            }

            var job = new Job
            {
                RecruiterProfileId = userId,
                Title = request.Title,
                Description = request.Description,
                Requirements = request.Requirements,
                Location = request.Location,
                SalaryRange = request.SalaryRange,
                JobType = request.JobType,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Recruiter {UserId} posted job: {Title}", userId, job.Title);
            return Ok(new { Message = "Job posted successfully.", JobId = job.Id });
        }

        // GET: api/jobs/recruiter (List recruiter's posted jobs)
        [HttpGet("recruiter")]
        public async Task<IActionResult> GetRecruiterJobs()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var jobs = await _context.Jobs
                .Include(j => j.RecruiterProfile)
                .Where(j => j.RecruiterProfileId == userId)
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new JobDTO
                {
                    Id = j.Id,
                    RecruiterId = j.RecruiterProfileId,
                    CompanyName = j.RecruiterProfile.CompanyName,
                    CompanyWebsite = j.RecruiterProfile.CompanyWebsite,
                    Title = j.Title,
                    Description = j.Description,
                    Requirements = j.Requirements,
                    Location = j.Location,
                    SalaryRange = j.SalaryRange,
                    JobType = j.JobType,
                    IsActive = j.IsActive,
                    CreatedAt = j.CreatedAt,
                    ApplicationsCount = j.Applications.Count
                })
                .ToListAsync();

            return Ok(jobs);
        }

        // GET: api/jobs/recruiter/dashboard-stats
        [HttpGet("recruiter/dashboard-stats")]
        public async Task<IActionResult> GetRecruiterDashboardStats()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var activeJobsCount = await _context.Jobs
                .Where(j => j.RecruiterProfileId == userId && j.IsActive)
                .CountAsync();

            var totalApplicationsCount = await _context.JobApplications
                .Where(a => a.Job.RecruiterProfileId == userId)
                .CountAsync();

            var shortlistedCount = await _context.JobApplications
                .Where(a => a.Job.RecruiterProfileId == userId && a.Status == "Shortlisted")
                .CountAsync();

            var recentApplications = await _context.JobApplications
                .Include(a => a.Job)
                .Include(a => a.StudentProfile)
                    .ThenInclude(s => s.User)
                .Where(a => a.Job.RecruiterProfileId == userId)
                .OrderByDescending(a => a.AppliedAt)
                .Take(5)
                .Select(a => new RecruiterRecentApplicationDTO
                {
                    ApplicationId = a.Id,
                    StudentId = a.StudentProfileId,
                    StudentName = a.StudentProfile.User.FullName,
                    TargetJobTitle = a.StudentProfile.TargetJobTitle,
                    JobTitle = a.Job.Title,
                    Status = a.Status,
                    AiMatchScore = a.AiMatchScore,
                    AppliedAt = a.AppliedAt
                })
                .ToListAsync();

            var stats = new RecruiterDashboardStats
            {
                ActiveJobsCount = activeJobsCount,
                TotalApplicationsCount = totalApplicationsCount,
                ShortlistedCount = shortlistedCount,
                RecentApplications = recentApplications
            };

            return Ok(stats);
        }

        // GET: api/jobs/{id}/applicants (List applicants for a job)
        [HttpGet("{id}/applicants")]
        public async Task<IActionResult> GetJobApplicants(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Verify recruiter owns the job
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                return NotFound(new { Message = "Job posting not found." });

            if (job.RecruiterProfileId != userId)
                return Forbid(); // Recruiter doesn't own this job posting

            var applicants = await _context.JobApplications
                .Include(a => a.StudentProfile)
                    .ThenInclude(s => s.User)
                .Include(a => a.StudentProfile)
                    .ThenInclude(s => s.Resume)
                .Where(a => a.JobId == id)
                .OrderByDescending(a => a.AppliedAt)
                .Select(a => new CandidateApplicationDTO
                {
                    ApplicationId = a.Id,
                    StudentId = a.StudentProfileId,
                    StudentName = a.StudentProfile.User.FullName,
                    StudentEmail = a.StudentProfile.User.Email ?? string.Empty,
                    TargetJobTitle = a.StudentProfile.TargetJobTitle,
                    AppliedAt = a.AppliedAt,
                    Status = a.Status,
                    AiMatchScore = a.AiMatchScore,
                    ResumeFileName = a.StudentProfile.Resume != null ? a.StudentProfile.Resume.FileName : null
                })
                .ToListAsync();

            return Ok(applicants);
        }

        // PUT: api/jobs/applications/{applicationId}/status (Shortlist or Reject)
        [HttpPut("applications/{applicationId}/status")]
        public async Task<IActionResult> UpdateApplicationStatus(int applicationId, [FromBody] UpdateApplicationStatusRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var application = await _context.JobApplications
                .Include(a => a.Job)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
                return NotFound(new { Message = "Application not found." });

            // Verify recruiter owns the job of this application
            if (application.Job.RecruiterProfileId != userId)
                return Forbid();

            application.Status = request.Status;
            application.Feedback = request.Feedback;

            _context.Entry(application).State = EntityState.Modified;
            
            // 1. Create database notification record for the candidate
            var notification = new Notification
            {
                UserId = application.StudentProfileId,
                Message = $"Your application for '{application.Job.Title}' was updated to '{request.Status}' by the recruiter.",
                Type = "ApplicationUpdate",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
            
            await _context.SaveChangesAsync();

            // 2. Relay real-time notification push via SignalR
            try
            {
                await _notificationHubContext.Clients.User(application.StudentProfileId).SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    message = notification.Message,
                    type = notification.Type,
                    createdAt = notification.CreatedAt.ToString("o"),
                    isRead = false
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send real-time SignalR notification to user {UserId}", application.StudentProfileId);
            }

            _logger.LogInformation("Recruiter {UserId} updated Application {AppId} status to {Status}", 
                userId, applicationId, request.Status);

            return Ok(new { Message = $"Candidate application status updated to {request.Status}." });
        }
    }
}
