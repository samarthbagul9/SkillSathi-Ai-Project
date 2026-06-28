using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkillSathiAPI.Data;
using SkillSathiAPI.DTOs;
using SkillSathiAPI.Entities;

namespace SkillSathiAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ChatController> _logger;

        public ChatController(
            AppDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<ChatController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        // GET: api/chat/history/{otherUserId}
        [HttpGet("history/{otherUserId}")]
        public async Task<IActionResult> GetChatHistory(string otherUserId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            var messages = await _context.ChatMessages
                .Where(m => (m.SenderId == currentUserId && m.ReceiverId == otherUserId) ||
                            (m.SenderId == otherUserId && m.ReceiverId == currentUserId))
                .OrderBy(m => m.Timestamp)
                .Select(m => new ChatMessageDTO
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    ReceiverId = m.ReceiverId,
                    Message = m.Message,
                    Timestamp = m.Timestamp,
                    IsRead = m.IsRead
                })
                .ToListAsync();

            return Ok(messages);
        }

        // GET: api/chat/contacts (Get unique chat inbox contacts)
        [HttpGet("contacts")]
        public async Task<IActionResult> GetChatContacts()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            // 1. Get all messages involving the current user
            var userMessages = await _context.ChatMessages
                .Where(m => m.SenderId == currentUserId || m.ReceiverId == currentUserId)
                .ToListAsync();

            // 2. Identify unique other user IDs
            var otherUserIds = userMessages
                .Select(m => m.SenderId == currentUserId ? m.ReceiverId : m.SenderId)
                .Distinct()
                .ToList();

            var contactsList = new List<ChatContactDTO>();

            // 3. Eagerly load user profiles and build DTOs
            foreach (var otherId in otherUserIds)
            {
                var user = await _userManager.FindByIdAsync(otherId);
                if (user == null) continue;

                var conversation = userMessages
                    .Where(m => m.SenderId == otherId || m.ReceiverId == otherId)
                    .OrderByDescending(m => m.Timestamp)
                    .ToList();

                var lastMsg = conversation.First();
                var unreadCount = conversation.Count(m => m.SenderId == otherId && !m.IsRead);

                contactsList.Add(new ChatContactDTO
                {
                    UserId = otherId,
                    FullName = user.FullName,
                    UserType = user.UserType,
                    LastMessage = lastMsg.Message,
                    LastMessageTimestamp = lastMsg.Timestamp,
                    UnreadCount = unreadCount
                });
            }

            // Order inbox contacts by most recent message
            var orderedContacts = contactsList
                .OrderByDescending(c => c.LastMessageTimestamp)
                .ToList();

            return Ok(orderedContacts);
        }

        // POST: api/chat/read/{otherUserId} (Mark messages as read)
        [HttpPost("read/{otherUserId}")]
        public async Task<IActionResult> MarkAsRead(string otherUserId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            var unreadMessages = await _context.ChatMessages
                .Where(m => m.SenderId == otherUserId && m.ReceiverId == currentUserId && !m.IsRead)
                .ToListAsync();

            if (unreadMessages.Any())
            {
                foreach (var msg in unreadMessages)
                {
                    msg.IsRead = true;
                }
                await _context.SaveChangesAsync();
                _logger.LogInformation("Marked {Count} messages from {OtherId} as read by {UserId}", unreadMessages.Count, otherUserId, currentUserId);
            }

            return Ok(new { Message = "Messages marked as read." });
        }
    }
}
