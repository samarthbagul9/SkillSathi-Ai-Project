using System;
using System.ComponentModel.DataAnnotations;

namespace SkillSathiAPI.DTOs
{
    public class CreateJobRequest
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Requirements { get; set; } = string.Empty;

        [Required]
        public string Location { get; set; } = string.Empty;

        public string SalaryRange { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(Full-time|Part-time|Internship|Contract)$", ErrorMessage = "JobType must be Full-time, Part-time, Internship, or Contract.")]
        public string JobType { get; set; } = "Full-time";
    }

    public class JobDTO
    {
        public int Id { get; set; }
        public string RecruiterId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyWebsite { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Requirements { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string SalaryRange { get; set; } = string.Empty;
        public string JobType { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int ApplicationsCount { get; set; }
    }

    public class JobApplicationDTO
    {
        public int ApplicationId { get; set; }
        public int JobId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string JobType { get; set; } = string.Empty;
        public DateTime AppliedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? AiMatchScore { get; set; }
        public string? Feedback { get; set; }
        public string? RecruiterId { get; set; }
    }

    public class CandidateApplicationDTO
    {
        public int ApplicationId { get; set; }
        public string StudentId { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public string TargetJobTitle { get; set; } = string.Empty;
        public DateTime AppliedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? AiMatchScore { get; set; }
        public string? ResumeFileName { get; set; }
    }

    public class UpdateApplicationStatusRequest
    {
        [Required]
        [RegularExpression("^(Applied|Shortlisted|Rejected)$", ErrorMessage = "Status must be Applied, Shortlisted, or Rejected.")]
        public string Status { get; set; } = string.Empty;

        public string? Feedback { get; set; }
    }

    public class RecruiterDashboardStats
    {
        public int ActiveJobsCount { get; set; }
        public int TotalApplicationsCount { get; set; }
        public int ShortlistedCount { get; set; }
        public List<RecruiterRecentApplicationDTO> RecentApplications { get; set; } = new();
    }

    public class RecruiterRecentApplicationDTO
    {
        public int ApplicationId { get; set; }
        public string StudentId { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string TargetJobTitle { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? AiMatchScore { get; set; }
        public DateTime AppliedAt { get; set; }
    }
}
