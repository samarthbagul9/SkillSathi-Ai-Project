using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SkillSathiAPI.Data;
using SkillSathiAPI.Entities;

namespace SkillSathiAPI.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;

        public ChatHub(AppDbContext context)
        {
            _context = context;
        }

        public async Task SendMessage(string receiverId, string message)
        {
            var senderId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(senderId) || string.IsNullOrEmpty(receiverId) || string.IsNullOrWhiteSpace(message))
                return;

            // 1. Save message to database for persistence
            var chatMsg = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message,
                Timestamp = DateTime.UtcNow,
                IsRead = false
            };

            _context.ChatMessages.Add(chatMsg);
            await _context.SaveChangesAsync();

            // 2. Emit real-time message to receiver and sender (for sync across tabs)
            var timestampStr = chatMsg.Timestamp.ToString("o");

            // SignalR maps Hub connections by User ID automatically if configured
            await Clients.User(receiverId).SendAsync("ReceiveMessage", senderId, message, timestampStr, chatMsg.Id);
            await Clients.User(senderId).SendAsync("ReceiveMessage", senderId, message, timestampStr, chatMsg.Id);
        }
    }
}
