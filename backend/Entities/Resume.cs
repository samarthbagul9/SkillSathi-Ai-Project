using System;

namespace SkillSathiAPI.Entities
{
    public class Resume
    {
        public int Id { get; set; }
        
        public string StudentProfileId { get; set; } = string.Empty;
        public StudentProfile StudentProfile { get; set; } = null!;

        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // AI generated fields (populated in Phase 4)
        public int? AtsScore { get; set; }
        public string? RawTextContent { get; set; }
        public string? FeedbackJson { get; set; } // Rich recommendations stored as JSON
    }
}
