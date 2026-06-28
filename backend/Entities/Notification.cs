using System;

namespace SkillSathiAPI.Entities
{
    public class Notification
    {
        public int Id { get; set; }

        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "General"; // "ApplicationUpdate", "NewMessage", "General"
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
