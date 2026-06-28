namespace SkillSathiAPI.Entities
{
    public class StudentSkill
    {
        public string StudentProfileId { get; set; } = string.Empty;
        public StudentProfile StudentProfile { get; set; } = null!;

        public int SkillId { get; set; }
        public Skill Skill { get; set; } = null!;

        public string ProficiencyLevel { get; set; } = "Beginner"; // "Beginner", "Intermediate", "Expert"
    }
}
