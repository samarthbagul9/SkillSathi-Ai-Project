using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkillSathiAPI.Data;
using SkillSathiAPI.Entities;

namespace SkillSathiAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ResumeController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ResumeController> _logger;

        // Allowed extensions and max file size (5 MB)
        private readonly string[] _allowedExtensions = { ".pdf", ".docx", ".doc" };
        private const long _maxFileSize = 5 * 1024 * 1024; 

        public ResumeController(
            AppDbContext context,
            IWebHostEnvironment environment,
            ILogger<ResumeController> logger)
        {
            _context = context;
            _environment = environment;
            _logger = logger;
        }

        // POST: api/resume/upload
        [HttpPost("upload")]
        public async Task<IActionResult> UploadResume(IFormFile file)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            if (file == null || file.Length == 0)
                return BadRequest(new { Message = "No file uploaded." });

            // 1. Validate file size
            if (file.Length > _maxFileSize)
                return BadRequest(new { Message = "File size exceeds the 5MB limit." });

            // 2. Validate file extension
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            if (Array.IndexOf(_allowedExtensions, fileExtension) < 0)
            {
                return BadRequest(new { Message = "Invalid file type. Only PDF, DOC, and DOCX are allowed." });
            }

            // Verify Student Profile exists
            var profile = await _context.StudentProfiles.FirstOrDefaultAsync(s => s.Id == userId);
            if (profile == null)
            {
                return NotFound(new { Message = "Student profile not found. Please set up your profile first." });
            }

            try
            {
                // 3. Prepare unique filename and path to prevent conflicts and path traversal
                var uploadFolder = Path.Combine(_environment.ContentRootPath, "Uploads", "Resumes");
                if (!Directory.Exists(uploadFolder))
                {
                    Directory.CreateDirectory(uploadFolder);
                }

                // Delete old physical file if it exists
                var existingResume = await _context.Resumes.FirstOrDefaultAsync(r => r.StudentProfileId == userId);
                if (existingResume != null)
                {
                    if (System.IO.File.Exists(existingResume.FilePath))
                    {
                        System.IO.File.Delete(existingResume.FilePath);
                    }
                    _context.Resumes.Remove(existingResume);
                    await _context.SaveChangesAsync();
                }

                var uniqueFileName = $"resume_{userId}_{DateTime.UtcNow.Ticks}{fileExtension}";
                var filePath = Path.Combine(uploadFolder, uniqueFileName);

                // 4. Save file to disk
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // 5. Save database record
                var resume = new Resume
                {
                    StudentProfileId = userId,
                    FileName = file.FileName,
                    FilePath = filePath,
                    UploadedAt = DateTime.UtcNow
                };

                _context.Resumes.Add(resume);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully uploaded resume for student {UserId}: {FileName}", userId, file.FileName);

                return Ok(new 
                { 
                    Message = "Resume uploaded successfully.", 
                    FileName = file.FileName,
                    UploadedAt = resume.UploadedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading resume for student {UserId}", userId);
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "An error occurred during file upload." });
            }
        }

        // GET: api/resume/download
        [HttpGet("download")]
        public async Task<IActionResult> DownloadResume()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var resume = await _context.Resumes.FirstOrDefaultAsync(r => r.StudentProfileId == userId);
            if (resume == null)
            {
                return NotFound(new { Message = "No resume found on this profile." });
            }

            if (!System.IO.File.Exists(resume.FilePath))
            {
                return NotFound(new { Message = "Physical resume file was not found on the server." });
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(resume.FilePath);
            var contentType = "application/pdf"; // default
            if (resume.FileName.EndsWith(".docx"))
                contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            else if (resume.FileName.EndsWith(".doc"))
                contentType = "application/msword";

            return File(fileBytes, contentType, resume.FileName);
        }

        // DELETE: api/resume
        [HttpDelete]
        public async Task<IActionResult> DeleteResume()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var resume = await _context.Resumes.FirstOrDefaultAsync(r => r.StudentProfileId == userId);
            if (resume == null)
            {
                return NotFound(new { Message = "No resume found on this profile." });
            }

            try
            {
                if (System.IO.File.Exists(resume.FilePath))
                {
                    System.IO.File.Delete(resume.FilePath);
                }

                _context.Resumes.Remove(resume);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted resume record and file for student: {UserId}", userId);
                return Ok(new { Message = "Resume deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting resume for student {UserId}", userId);
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "An error occurred during file deletion." });
            }
        }

        // GET: api/resume/download/{studentId} (Recruiter downloads candidate resume)
        [HttpGet("download/{studentId}")]
        public async Task<IActionResult> DownloadStudentResume(string studentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var userRole = User.FindFirstValue(ClaimTypes.Role);
            if (userRole != "Recruiter")
            {
                return BadRequest(new { Message = "Only recruiters can download candidate resumes." });
            }

            var resume = await _context.Resumes.FirstOrDefaultAsync(r => r.StudentProfileId == studentId);
            if (resume == null)
            {
                return NotFound(new { Message = "No resume found for this candidate." });
            }

            if (!System.IO.File.Exists(resume.FilePath))
            {
                return NotFound(new { Message = "Physical resume file was not found on the server." });
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(resume.FilePath);
            var contentType = "application/pdf";
            if (resume.FileName.EndsWith(".docx"))
                contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            else if (resume.FileName.EndsWith(".doc"))
                contentType = "application/msword";

            return File(fileBytes, contentType, resume.FileName);
        }
    }
}
