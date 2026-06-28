using System.Collections.Generic;

namespace SkillSathiAPI.Entities
{
    public class StudentProfile
    {
        // Primary Key mapped to UserId to ensure 1:1 relationship
        public string Id { get; set; } = string.Empty;
        
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        public string Bio { get; set; } = string.Empty;
        public string EducationDetails { get; set; } = string.Empty;
        public string TargetJobTitle { get; set; } = string.Empty;
        
        public string LinkedIn { get; set; } = string.Empty;
        public string Github { get; set; } = string.Empty;

        // Navigation properties
        public ICollection<StudentSkill> StudentSkills { get; set; } = new List<StudentSkill>();
        public Resume? Resume { get; set; }
    }
}
