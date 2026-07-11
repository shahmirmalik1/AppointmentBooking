using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentBooking.Models
{
    [Table("Procedure")]
    public class Procedure
    {
        [Key]
        public int ID { get; set; }

        [Required]
        public string Procedure_Name { get; set; } = "";

        [Required]
        public int Procedure_Duration_mins { get; set; } = 0;
        
        [Required]
        public double Price { get; set; } = 0.0;


        // [Required, EmailAddress]
        //public string CustomerEmail { get; set; } = null!;
        // appointment start time (UTC recommended)

    }
}
