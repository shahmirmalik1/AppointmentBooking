using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentBooking.Models
{
    [Table("Doctor")]
    public class Doctor
    {
        [Key]
        public int ID { get; set; }

        [Required]
        public string First_Name { get; set; } = "";

        [Required]
        public string Last_Name { get; set; } = "";

        [Required]
        public string Phone_Number { get; set; } = "";

        [Required]
        public string Email_Address { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public string Role { get; set; } = "";
    }
}
