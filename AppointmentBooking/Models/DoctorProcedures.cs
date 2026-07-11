using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentBooking.Models
{
    [Table("DoctorProcedures")]
    public class DoctorProcedures
    {
        [Key]
        public int ID { get; set; }
        
        [Required]
        public int DoctorID { get; set; }
        
        [Required]
        public int ProcedureID { get; set; }


        // [Required, EmailAddress]
        //public string CustomerEmail { get; set; } = null!;
        // appointment start time (UTC recommended)

    }
}
