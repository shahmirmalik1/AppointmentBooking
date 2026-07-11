using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentBooking.Models
{
    [Table("InstitutionInformation")]
    public class InstitutionInformation
    {
        [Key]
        public int ID { get; set; }

        [Required]
        public string Website_Title { get; set; } = "";

        public string? Email_Address { get; set; }

        public string? Phone_Number { get; set; }
    }
}
