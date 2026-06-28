using System;
using System.Collections.Generic;

namespace SkillSathiAPI.Entities
{
    public class Job
    {
        public int Id { get; set; }
        
        public string RecruiterProfileId { get; set; } = string.Empty;
        public RecruiterProfile RecruiterProfile { get; set; } = null!;

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Requirements { get; set; } = string.Empty; // text area/markdown
        public string Location { get; set; } = string.Empty; // e.g., "Remote", "Bangalore", "Mumbai"
        public string SalaryRange { get; set; } = string.Empty; // e.g., "6 - 10 LPA"
        public string JobType { get; set; } = "Full-time"; // "Full-time", "Part-time", "Internship", "Contract"

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property for applications
        public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
    }
}
