using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentBooking.Models
{
    [Table("CustomerQuery")]
    public class CustomerQuery
    {
        [Key]
        public int ID { get; set; }

        [Required]
        public string First_Name { get; set; }

        [Required]
        public string Surname { get; set; }

        [Required]
        public string Email_Address { get; set; }

        [Required]
        public string Phone_Number { get; set; }

        public int? Procedure_ID { get; set; }
        public int? Doctor_ID { get; set; }

        public DateTime? Date_Time { get;set; }

        public string? Additional_Information { get; set; }

        [Required]
        public bool Confirmed { get; set; }


    }
}
