using AppointmentBooking.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentBooking.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> opts) : base(opts) { }

        public DbSet<Appointment> Appointments => Set<Appointment>();
        public DbSet<Doctor> Doctors => Set<Doctor>();
        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<InstitutionInformation> InstitutionInformation => Set<InstitutionInformation>();
        public DbSet<Procedure> Procedures => Set<Procedure>();
        public DbSet<DoctorProcedures> DoctorProcedures => Set<DoctorProcedures>();
        public DbSet<CustomerQuery> CustomerQueries => Set<CustomerQuery>();
    }
}
