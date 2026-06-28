namespace SkillSathiAPI.Entities
{
    public class RecruiterProfile
    {
        // Primary Key mapped to UserId to ensure 1:1 relationship
        public string Id { get; set; } = string.Empty;

        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        public string CompanyName { get; set; } = string.Empty;
        public string CompanyWebsite { get; set; } = string.Empty;
        public string CompanyBio { get; set; } = string.Empty;
    }
}
