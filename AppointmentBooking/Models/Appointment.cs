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
        public int Dentist_ID { get; set; }

        [Required]
        public DateTime Start_Time { get; set; }

        [Required]
        public int Duration_mins { get; set; } = 30;

        [Required]
        public string Customer_Full_Name {get;set;} = "";
        
        [Required]
        public DateOnly Customer_Date_Of_Birth {get;set;} = DateOnly.FromDateTime(DateTime.MinValue);
        
        [Required]
        public int Customer_Phone_Number {get;set;} = 0;

        public string? Customer_Email_Address {get;set;}

        [Required]
        public bool Completed {get;set;} = false;

        public string? Notes {get;set;}


    }
}
