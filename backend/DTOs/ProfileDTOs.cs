using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SkillSathiAPI.DTOs
{
    public class StudentSkillDTO
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string ProficiencyLevel { get; set; } = "Beginner";
    }

    public class StudentProfileDTO
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
        public string EducationDetails { get; set; } = string.Empty;
        public string TargetJobTitle { get; set; } = string.Empty;
        public string LinkedIn { get; set; } = string.Empty;
        public string Github { get; set; } = string.Empty;
        public string? ResumeFileName { get; set; }
        public int? ResumeAtsScore { get; set; }
        public List<StudentSkillDTO> Skills { get; set; } = new List<StudentSkillDTO>();
    }

    public class UpdateStudentProfileRequest
    {
        public string Bio { get; set; } = string.Empty;
        public string EducationDetails { get; set; } = string.Empty;
        
        [Required]
        public string TargetJobTitle { get; set; } = string.Empty;
        
        public string LinkedIn { get; set; } = string.Empty;
        public string Github { get; set; } = string.Empty;
    }

    public class AddSkillRequest
    {
        [Required]
        public int SkillId { get; set; }

        [Required]
        [RegularExpression("^(Beginner|Intermediate|Expert)$", ErrorMessage = "ProficiencyLevel must be Beginner, Intermediate, or Expert.")]
        public string ProficiencyLevel { get; set; } = "Beginner";
    }

    public class RecruiterProfileDTO
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyWebsite { get; set; } = string.Empty;
        public string CompanyBio { get; set; } = string.Empty;
    }

    public class UpdateRecruiterProfileRequest
    {
        [Required]
        public string CompanyName { get; set; } = string.Empty;
        
        public string CompanyWebsite { get; set; } = string.Empty;
        public string CompanyBio { get; set; } = string.Empty;
    }
}
