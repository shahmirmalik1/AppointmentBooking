using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentBooking.Models
{
    [Table("Customer")]
    public class Customer
    {
        [Key]
        public int ID { get; set; }

        [Required]
        public string First_Name { get; set; }

        [Required]
        public string Last_Name { get; set; }

        [Required]
        public string Phone_Number { get; set; }

        [Required]
        public string Email_Address { get; set; }
    }
}
