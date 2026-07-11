using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentBooking.Models
{
    [Table("Appointment")]
    public class Appointment
    {
        [Key]
        public int ID { get; set; }
        
        [Required]
        public int Customer_ID { get; set; }
        
        [Required]
        public int Dentist_ID { get; set; }

        [Required]
        public DateTime Start_Time { get; set; }

        [Required]
        public int Duration_mins { get; set; } = 30;

        [NotMapped]
        public bool Accepted { get; set; } = false;

        [NotMapped]
        public bool Confirmed { get; set; } = false;


        // [Required, EmailAddress]
        //public string CustomerEmail { get; set; } = null!;
        // appointment start time (UTC recommended)

    }
}
