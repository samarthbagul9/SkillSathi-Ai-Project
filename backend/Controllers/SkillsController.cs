using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
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
    public class SkillsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SkillsController> _logger;

        public SkillsController(AppDbContext context, ILogger<SkillsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/skills (Fetch all master skills)
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetMasterSkills()
        {
            var skills = await _context.Skills.OrderBy(s => s.Category).ThenBy(s => s.Name).ToListAsync();
            return Ok(skills);
        }

        // POST: api/skills/add (Add skill to student profile)
        [HttpPost("add")]
        public async Task<IActionResult> AddSkillToProfile([FromBody] AddSkillRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Verify if student profile exists
            var profile = await _context.StudentProfiles.FirstOrDefaultAsync(s => s.Id == userId);
            if (profile == null)
                return NotFound(new { Message = "Student profile not found." });

            // Verify if master skill exists
            var skillExists = await _context.Skills.AnyAsync(s => s.Id == request.SkillId);
            if (!skillExists)
                return BadRequest(new { Message = "Skill ID does not exist in master list." });

            // Check if user already has this skill
            var existingStudentSkill = await _context.StudentSkills
                .FirstOrDefaultAsync(ss => ss.StudentProfileId == userId && ss.SkillId == request.SkillId);

            if (existingStudentSkill != null)
            {
                // Skill already exists, let's just update the proficiency
                existingStudentSkill.ProficiencyLevel = request.ProficiencyLevel;
                _context.Entry(existingStudentSkill).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return Ok(new { Message = "Skill proficiency updated successfully." });
            }

            // Create new StudentSkill mapping
            var studentSkill = new StudentSkill
            {
                StudentProfileId = userId,
                SkillId = request.SkillId,
                ProficiencyLevel = request.ProficiencyLevel
            };

            _context.StudentSkills.Add(studentSkill);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added Skill {SkillId} with proficiency {Level} to Student: {UserId}", 
                request.SkillId, request.ProficiencyLevel, userId);

            return Ok(new { Message = "Skill added to profile successfully." });
        }

        // DELETE: api/skills/remove/{skillId} (Remove skill from student profile)
        [HttpDelete("remove/{skillId}")]
        public async Task<IActionResult> RemoveSkillFromProfile(int skillId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var studentSkill = await _context.StudentSkills
                .FirstOrDefaultAsync(ss => ss.StudentProfileId == userId && ss.SkillId == skillId);

            if (studentSkill == null)
            {
                return NotFound(new { Message = "Skill not found on this profile." });
            }

            _context.StudentSkills.Remove(studentSkill);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed Skill {SkillId} from Student: {UserId}", skillId, userId);
            return Ok(new { Message = "Skill removed from profile successfully." });
        }
    }
}
