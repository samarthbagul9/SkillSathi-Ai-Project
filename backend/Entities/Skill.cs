using System.Collections.Generic;

namespace SkillSathiAPI.Entities
{
    public class Skill
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // e.g., "Frontend", "Backend", "DevOps"

        // Navigation property for many-to-many relationship
        public ICollection<StudentSkill> StudentSkills { get; set; } = new List<StudentSkill>();
    }
}
