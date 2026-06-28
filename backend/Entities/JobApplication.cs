using System;

namespace SkillSathiAPI.Entities
{
    public class JobApplication
    {
        public int Id { get; set; }

        public int JobId { get; set; }
        public Job Job { get; set; } = null!;

        public string StudentProfileId { get; set; } = string.Empty;
        public StudentProfile StudentProfile { get; set; } = null!;

        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Applied"; // "Applied", "Shortlisted", "Rejected"
        
        // AI generated compatibility score (Phase 4)
        public int? AiMatchScore { get; set; }
        public string? Feedback { get; set; } // Recruiter notes or review feedback
    }
}
