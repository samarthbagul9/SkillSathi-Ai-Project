using System;
using System.Collections.Generic;

namespace SkillSathiAPI.DTOs
{
    public class AdminDashboardStats
    {
        public int TotalUsers { get; set; }
        public int TotalStudents { get; set; }
        public int TotalRecruiters { get; set; }
        public int TotalJobs { get; set; }
        public int ActiveJobs { get; set; }
        public int TotalApplications { get; set; }
        
        public int AppliedApplications { get; set; }
        public int ShortlistedApplications { get; set; }
        public int RejectedApplications { get; set; }
        
        public string DatabaseType { get; set; } = string.Empty;
        public string GeminiStatus { get; set; } = string.Empty;
        
        public List<SkillStat> PopularSkills { get; set; } = new();
    }

    public class SkillStat
    {
        public string SkillName { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class AdminUserListItem
    {
        public string Id { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string UserType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
        public string ExtraInfo { get; set; } = string.Empty;
    }
}
