using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AppointmentBooking.Data;
using AppointmentBooking.Helpers;
using AppointmentBooking.Models;

namespace AppointmentBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentBookingController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public AppointmentBookingController(ApplicationDbContext db) => _db = db;

        // GET: api/appointments
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _db.Appointments.OrderBy(a => a.Start_Time).ToListAsync());

        [HttpPost("DentistLogin")]
        public async Task<IActionResult> DentistLogin([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email_Address) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Email and password are required.");
            }

            var dentist = await _db.Doctors
                .Where(d => d.Email_Address != null && d.Email_Address.ToLower() == request.Email_Address.ToLower())
                .Select(d => new
                {
                    d.ID,
                    d.First_Name,
                    d.Last_Name,
                    d.Email_Address,
                    d.Phone_Number,
                    d.Role,
                    d.PasswordHash
                })
                .FirstOrDefaultAsync();

            if (dentist == null || !PasswordHashUtility.Verify(request.Password, dentist.PasswordHash))
            {
                return Unauthorized("Invalid credentials.");
            }

            var response = new DentistLoginResponse
            {
                ID = dentist.ID,
                First_Name = dentist.First_Name ?? string.Empty,
                Last_Name = dentist.Last_Name ?? string.Empty,
                Email_Address = dentist.Email_Address ?? string.Empty,
                Phone_Number = dentist.Phone_Number ?? string.Empty,
                Role = dentist.Role ?? string.Empty
            };

            return Ok(response);
        }

        [HttpGet("DentistProfile/{doctorID:int}")]
        public async Task<IActionResult> DentistProfile(int doctorID)
        {
            var dentist = await _db.Doctors
                .Where(d => d.ID == doctorID)
                .Select(d => new DentistProfileResponse
                {
                    ID = d.ID,
                    First_Name = d.First_Name,
                    Last_Name = d.Last_Name,
                    Email_Address = d.Email_Address,
                    Phone_Number = d.Phone_Number,
                    Role = d.Role
                })
                .FirstOrDefaultAsync();

            if (dentist == null)
            {
                return NotFound();
            }

            return Ok(dentist);
        }

        [HttpPut("DentistProfile/{doctorID:int}")]
        public async Task<IActionResult> UpdateDentistProfile(int doctorID, [FromBody] DentistProfileUpdateRequest request)
        {
            var dentist = await _db.Doctors.FindAsync(doctorID);
            if (dentist == null)
            {
                return NotFound();
            }

            if (!string.IsNullOrWhiteSpace(request.Email_Address) &&
                request.Email_Address.ToLower() != dentist.Email_Address?.ToLower())
            {
                var emailTaken = await _db.Doctors.AnyAsync(d => d.Email_Address.ToLower() == request.Email_Address.ToLower() && d.ID != doctorID);
                if (emailTaken)
                {
                    return Conflict("Email address is already in use.");
                }
                dentist.Email_Address = request.Email_Address;
            }

            if (!string.IsNullOrWhiteSpace(request.Phone_Number))
            {
                dentist.Phone_Number = request.Phone_Number;
            }

            if (!string.IsNullOrWhiteSpace(request.First_Name))
            {
                dentist.First_Name = request.First_Name;
            }

            if (!string.IsNullOrWhiteSpace(request.Last_Name))
            {
                dentist.Last_Name = request.Last_Name;
            }

            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                dentist.PasswordHash = PasswordHashUtility.Hash(request.Password);
            }

            await _db.SaveChangesAsync();

            var response = new DentistProfileResponse
            {
                ID = dentist.ID,
                First_Name = dentist.First_Name,
                Last_Name = dentist.Last_Name,
                Email_Address = dentist.Email_Address,
                Phone_Number = dentist.Phone_Number,
                Role = dentist.Role
            };

            return Ok(response);
        }

        // GET: api/appointments/available?dentist=Dr%20Smith&date=2025-10-15
        // returns available slots for a date (simple example)
        [HttpGet("GetAvailableSlots")]
        public async Task<IActionResult> GetAvailableSlots(string firstname,string lastname, [FromQuery] DateTime date)
        {
            // Basic approach: define working hours and 30-minute slots
            var dayStart = date.Date.AddHours(9);  // 9:00
            var dayEnd = date.Date.AddHours(17);   // 17:00
            var slotMinutes = 30;

            var dentists = await _db.Doctors.Where(a => a.First_Name == firstname && a.Last_Name == lastname).ToListAsync();
            var dentistID  =  dentists?.FirstOrDefault()?.ID;

            var existing = await _db.Appointments
                .Where(a => a.Dentist_ID == dentistID && a.Start_Time.Date == date.Date)
                .ToListAsync();

            var slots = new List<DateTime>();
            for (var t = dayStart; t.AddMinutes(slotMinutes) <= dayEnd; t = t.AddMinutes(slotMinutes))
            {
                var slotEnd = t.AddMinutes(slotMinutes);
                var conflict = existing.Any(e =>
                    e.Start_Time < slotEnd && e.Start_Time.AddMinutes(e.Duration_mins) > t);
                if (!conflict) slots.Add(t);
            }

            return Ok(slots);
        }

        [HttpPost("CreateDentist")]
        public async Task<IActionResult> CreateDentist([FromBody] Doctor dto)
        {
            // Prevent overlapping appointments for same dentist

            var conflicts = await _db.Doctors.AnyAsync(a =>
               a.First_Name == dto.First_Name && a.Last_Name == dto.Last_Name);

            if (conflicts) return Conflict("Dentist already exists!");

            var dentist = new Doctor
            {
                First_Name = dto.First_Name,
                Last_Name = dto.Last_Name,
                Email_Address = dto.Email_Address,
                Phone_Number = dto.Phone_Number
            };

            _db.Doctors.Add(dentist);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = dentist.ID }, dentist);
        }

        [HttpPost("CreateProcedure")]
        public async Task<IActionResult> CreateProcedure([FromBody] Procedure dto)
        {
            var conflicts = await _db.Procedures.AnyAsync(p => p.Procedure_Name == dto.Procedure_Name);
            if (conflicts) return Conflict("Procedure already exists!");

            var proc = new Procedure
            {
                Procedure_Name = dto.Procedure_Name,
                Procedure_Duration_mins = dto.Procedure_Duration_mins,
                Price = dto.Price
            };

            _db.Procedures.Add(proc);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAllProcedures), new { id = proc.ID }, proc);
        }

        [HttpPost("LinkDoctorProcedure")]
        public async Task<IActionResult> LinkDoctorProcedure([FromBody] DoctorProcedures dto)
        {
            // Prevent duplicate link
            var exists = await _db.DoctorProcedures.AnyAsync(dp => dp.DoctorID == dto.DoctorID && dp.ProcedureID == dto.ProcedureID);
            if (exists) return Conflict("Doctor already linked to procedure.");

            var link = new DoctorProcedures
            {
                DoctorID = dto.DoctorID,
                ProcedureID = dto.ProcedureID
            };

            _db.DoctorProcedures.Add(link);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAllDoctorsForProcedure), new { procedureID = dto.ProcedureID }, link);
        }

        // POST: api/customer
        [HttpPost("RegisterCusomter")]
        public async Task<IActionResult> RegisterCustomer([FromBody] Customer dto)
        {
            // Prevent overlapping appointments for same dentist

            var conflicts = await _db.Customers.AnyAsync(a =>
               a.First_Name == dto.First_Name && a.Last_Name == dto.Last_Name);

            if (conflicts) return Conflict("Dentist already exists!");

            var customer = new Customer
            {
                ID = dto.ID,
                First_Name = dto.First_Name,
                Last_Name = dto.Last_Name
            };

            _db.Customers.Add(customer);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = customer.ID }, customer);
        }

        // POST: api/dentists
        [HttpPost("CreateAppointment")]
        public async Task<IActionResult> CreateAppointment([FromBody] Appointment dto)
        {
            // Basic validation
            if (dto.Start_Time == default) return BadRequest("Invalid start time.");
            if (dto.Duration_mins <= 0) dto.Duration_mins = 30;

            // Prevent overlapping appointments for same dentist

            var conflicts = await _db.Appointments.AnyAsync(a =>
                a.Dentist_ID == dto.Dentist_ID &&
                a.Start_Time < dto.Start_Time.AddMinutes(dto.Duration_mins) &&
                a.Start_Time.AddMinutes(a.Duration_mins) > dto.Start_Time);

            if (conflicts) return Conflict("Selected slot is already taken.");

            var appt = new Appointment
            {
                Customer_Full_Name = dto.Customer_Full_Name,
                Customer_Date_Of_Birth = dto.Customer_Date_Of_Birth,
                Customer_Phone_Number = dto.Customer_Phone_Number,
                Customer_Email_Address = dto.Customer_Email_Address ?? string.Empty,
                Completed = dto.Completed,
                Notes = dto.Notes ?? string.Empty,
                Dentist_ID = dto.Dentist_ID,
                Start_Time = dto.Start_Time,
                Duration_mins = dto.Duration_mins
            };

            _db.Appointments.Add(appt);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = appt.ID }, appt);
        }

        // GET: api/appointments/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var appt = await _db.Appointments.FindAsync(id);
            if (appt == null) return NotFound();
            return Ok(appt);
        }

        [HttpGet("GetAllDoctors")]
        public async Task<IActionResult> GetAllDoctors()
        {

            var existing = await _db.Doctors
                .ToListAsync();

            return Ok(existing);
        }

        // DELETE: api/appointments/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            var appt = await _db.Appointments.FindAsync(id);
            if (appt == null) return NotFound();
            _db.Appointments.Remove(appt);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("UpdateAppointment/{appointmentID:int}")]
        public async Task<IActionResult> UpdateAppointment(int appointmentID, [FromBody] AppointmentUpdateRequest request)
        {
            var appointment = await _db.Appointments.FindAsync(appointmentID);
            if (appointment == null)
            {
                return NotFound();
            }

            if (request.Customer_Full_Name != null)
            {
                appointment.Customer_Full_Name = request.Customer_Full_Name.Trim();
            }

            if (request.Customer_Phone_Number.HasValue)
            {
                appointment.Customer_Phone_Number = request.Customer_Phone_Number.Value;
            }

            if (request.Customer_Email_Address != null)
            {
                appointment.Customer_Email_Address = request.Customer_Email_Address.Trim();
            }

            if (request.Notes != null)
            {
                appointment.Notes = request.Notes.Trim();
            }

            if (request.Completed.HasValue)
            {
                appointment.Completed = request.Completed.Value;
            }

            await _db.SaveChangesAsync();

            return Ok(appointment);
        }

        [HttpGet("GetContactInformation/{id:int}")]
        public async Task<IActionResult> GetContactInformation(int id)
        {
            var existing = await _db.InstitutionInformation
                .FindAsync(id);

            if (existing == null) return NotFound();
            return Ok(existing);
        }

        [HttpGet("GetAllProcedures")]
        public async Task<IActionResult> GetAllProcedures()
        {
            var existing = await _db.Procedures
                .ToListAsync();

            return Ok(existing);
        }

        [HttpGet("GetAllDoctorsForProcedure/{procedureID:int}")]
        public async Task<IActionResult> GetAllDoctorsForProcedure(int procedureID)
        {
            var existing = await _db.DoctorProcedures
                .Where(dp => dp.ProcedureID == procedureID)
                .ToListAsync();

            var doctorIDs = existing.Select(dp => dp.DoctorID).ToList();
            
            var doctors = await _db.Doctors
                .Where(d => doctorIDs.Contains(d.ID))
                .ToListAsync();
            return Ok(doctors);
        }

        [HttpPost("CreateAQuery")]
        public async Task<IActionResult> CreateAQuery([FromBody] CustomerQuery dto)
        {
            var appt = new CustomerQuery
            {
                First_Name = dto.First_Name,
                Surname = dto.Surname,
                Date_Of_Birth = dto.Date_Of_Birth,
                Email_Address = dto.Email_Address,
                Phone_Number = dto.Phone_Number,
                Procedure_ID = dto.Procedure_ID,
                Doctor_ID = dto.Doctor_ID,
                Date_Time = dto.Date_Time,
                Additional_Information = dto.Additional_Information,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Pending" : dto.Status,
            };

            _db.CustomerQuery.Add(appt);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = appt.ID }, appt);
        }

        [HttpGet("GetDoctorQueries/{doctorID:int}")]
        public async Task<IActionResult> GetDoctorQueries(int doctorID, [FromQuery] bool includeResolved = false)
        {
            var queries = await (from q in _db.CustomerQuery
                                 where q.Doctor_ID == doctorID
                                    && (includeResolved
                                        || q.Status == null
                                        || (q.Status != "Accepted"
                                            && q.Status != "Rejected"))
                                 join p in _db.Procedures on q.Procedure_ID equals p.ID into procedures
                                 from proc in procedures.DefaultIfEmpty()
                                 orderby q.Date_Time descending
                                 select new DoctorQueryResponse
                                 {
                                     ID = q.ID,
                                     First_Name = q.First_Name ?? string.Empty,
                                     Surname = q.Surname ?? string.Empty,
                                     Date_Of_Birth = q.Date_Of_Birth,
                                     Email_Address = q.Email_Address ?? string.Empty,
                                     Phone_Number = q.Phone_Number ?? string.Empty,
                                     Procedure_ID = q.Procedure_ID,
                                     Procedure_Name = proc != null ? (proc.Procedure_Name ?? string.Empty) : null,
                                     Doctor_ID = q.Doctor_ID,
                                     Date_Time = q.Date_Time,
                                     Additional_Information = q.Additional_Information,
                                     Status = q.Status ?? "Pending",
                                 }).ToListAsync();

            return Ok(queries);
        }

        [HttpGet("GetAllQueries")]
        public async Task<IActionResult> GetAllQueries()
        {
            var queries = await (from q in _db.CustomerQuery
                                 join p in _db.Procedures on q.Procedure_ID equals p.ID into procedures
                                 from proc in procedures.DefaultIfEmpty()
                                 orderby q.Date_Time descending
                                 select new DoctorQueryResponse
                                 {
                                     ID = q.ID,
                                     First_Name = q.First_Name ?? string.Empty,
                                     Surname = q.Surname ?? string.Empty,
                                     Date_Of_Birth = q.Date_Of_Birth,
                                     Email_Address = q.Email_Address ?? string.Empty,
                                     Phone_Number = q.Phone_Number ?? string.Empty,
                                     Procedure_ID = q.Procedure_ID,
                                     Procedure_Name = proc != null ? (proc.Procedure_Name ?? string.Empty) : null,
                                     Doctor_ID = q.Doctor_ID,
                                     Date_Time = q.Date_Time,
                                     Additional_Information = q.Additional_Information,
                                     Status = q.Status ?? "Pending",
                                 }).ToListAsync();

            return Ok(queries);
        }

        [HttpGet("GetDoctorAppointments/{doctorID:int}")]
        public async Task<IActionResult> GetDoctorAppointments(int doctorID)
        {
            var appointments = await _db.Appointments
                .Where(a => a.Dentist_ID == doctorID)
                .OrderBy(a => a.Start_Time)
                .ToListAsync();

            var acceptedQueries = await _db.CustomerQuery
                .Where(q => q.Doctor_ID == doctorID && q.Status == "Accepted")
                .ToListAsync();

            var procedureIds = acceptedQueries
                .Where(q => q.Procedure_ID.HasValue)
                .Select(q => q.Procedure_ID!.Value)
                .Distinct()
                .ToList();

            var procedures = await _db.Procedures
                .Where(p => procedureIds.Contains(p.ID))
                .ToDictionaryAsync(p => p.ID, p => p.Procedure_Name);

            var response = appointments.Select(a =>
            {
                var matchedQuery = acceptedQueries.FirstOrDefault(q =>
                    q.Date_Time.HasValue
                    && q.Date_Time.Value == a.Start_Time
                    && string.Equals($"{q.First_Name} {q.Surname}".Trim(), a.Customer_Full_Name, StringComparison.OrdinalIgnoreCase));

                string? procedureName = null;
                if (matchedQuery?.Procedure_ID is int procedureId && procedures.TryGetValue(procedureId, out var value))
                {
                    procedureName = value;
                }

                return new DoctorAppointmentResponse
                {
                    ID = a.ID,
                    Dentist_ID = a.Dentist_ID,
                    Start_Time = a.Start_Time,
                    Duration_mins = a.Duration_mins,
                    Customer_Full_Name = a.Customer_Full_Name,
                    Customer_Date_Of_Birth = a.Customer_Date_Of_Birth,
                    Customer_Phone_Number = a.Customer_Phone_Number,
                    Customer_Email_Address = a.Customer_Email_Address ?? string.Empty,
                    Completed = a.Completed,
                    Notes = a.Notes ?? string.Empty,
                    Procedure_Name = procedureName,
                };
            }).ToList();

            return Ok(response);
        }

        [HttpPut("ConfirmDoctorQuery/{queryID:int}")]
        public async Task<IActionResult> ConfirmDoctorQuery(int queryID)
        {
            return await SetQueryStatus(queryID, "Accepted");
        }

        [HttpPut("RejectDoctorQuery/{queryID:int}")]
        public async Task<IActionResult> RejectDoctorQuery(int queryID)
        {
            return await SetQueryStatus(queryID, "Rejected");
        }

        [HttpPut("MoveDoctorQuery/{queryID:int}")]
        public async Task<IActionResult> MoveDoctorQuery(int queryID)
        {
            return await SetQueryStatus(queryID, "Move Appointment");
        }

        [HttpPut("UpdateDoctorQueryStatus/{queryID:int}")]
        public async Task<IActionResult> UpdateDoctorQueryStatus(int queryID, [FromBody] DoctorQueryStatusUpdateRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest("Status is required.");
            }

            return await SetQueryStatus(queryID, request.Status);
        }

        private async Task<IActionResult> SetQueryStatus(int queryID, string requestedStatus)
        {
            var query = await _db.CustomerQuery.FindAsync(queryID);
            if (query == null) return NotFound();

            var nextStatus = NormalizeQueryStatus(requestedStatus);
            if (nextStatus == null)
            {
                return BadRequest("Invalid status. Allowed values are Accepted, Rejected, Move Appointment, and Pending.");
            }

            var currentStatus = NormalizeQueryStatus(query.Status) ?? "Pending";
            if (nextStatus == currentStatus)
            {
                return Ok(new { Status = currentStatus });
            }

            if (nextStatus == "Accepted")
            {
                var ensureResult = await EnsureAppointmentForAcceptedQuery(query);
                if (!ensureResult.Success)
                {
                    return Conflict(ensureResult.Error);
                }
            }
            else if (currentStatus == "Accepted")
            {
                await RemoveAppointmentsForQuery(query);
            }

            query.Status = nextStatus;
            await _db.SaveChangesAsync();
            return Ok(new { Status = nextStatus });
        }

        private static string? NormalizeQueryStatus(string? status)
        {
            var normalized = (status ?? "Pending").Trim();
            if (normalized.Equals("Accepted", StringComparison.OrdinalIgnoreCase)) return "Accepted";
            if (normalized.Equals("Rejected", StringComparison.OrdinalIgnoreCase)) return "Rejected";
            if (normalized.Equals("Move Appointment", StringComparison.OrdinalIgnoreCase)) return "Move Appointment";
            if (normalized.Equals("Pending", StringComparison.OrdinalIgnoreCase)) return "Pending";
            return null;
        }

        private async Task<(bool Success, string? Error)> EnsureAppointmentForAcceptedQuery(CustomerQuery query)
        {
            if (!query.Doctor_ID.HasValue || !query.Date_Time.HasValue)
            {
                return (false, "Doctor and appointment time are required to accept a query.");
            }

            var dentistId = query.Doctor_ID.Value;
            var startTime = query.Date_Time.Value;
            var customerName = $"{query.First_Name} {query.Surname}".Trim();

            var existing = await _db.Appointments.AnyAsync(a =>
                a.Dentist_ID == dentistId
                && a.Start_Time == startTime
                && a.Customer_Date_Of_Birth == query.Date_Of_Birth
                && a.Customer_Full_Name.ToLower() == customerName.ToLower());

            if (existing)
            {
                return (true, null);
            }

            var procedureDuration = 30;
            if (query.Procedure_ID.HasValue)
            {
                var procedure = await _db.Procedures.FindAsync(query.Procedure_ID.Value);
                if (procedure != null && procedure.Procedure_Duration_mins > 0)
                {
                    procedureDuration = procedure.Procedure_Duration_mins;
                }
            }

            var hasConflict = await _db.Appointments.AnyAsync(a =>
                a.Dentist_ID == dentistId
                && a.Start_Time < startTime.AddMinutes(procedureDuration)
                && a.Start_Time.AddMinutes(a.Duration_mins) > startTime);

            if (hasConflict)
            {
                return (false, "Selected slot is already taken.");
            }

            var appointment = new Appointment
            {
                Dentist_ID = dentistId,
                Start_Time = startTime,
                Duration_mins = procedureDuration,
                Customer_Full_Name = customerName,
                Customer_Date_Of_Birth = query.Date_Of_Birth,
                Customer_Phone_Number = int.TryParse(query.Phone_Number, out var phone) ? phone : 0,
                Customer_Email_Address = query.Email_Address ?? string.Empty,
                Completed = false,
                Notes = query.Additional_Information ?? string.Empty,
            };

            _db.Appointments.Add(appointment);
            return (true, null);
        }

        private async Task RemoveAppointmentsForQuery(CustomerQuery query)
        {
            if (!query.Doctor_ID.HasValue || !query.Date_Time.HasValue)
            {
                return;
            }

            var dentistId = query.Doctor_ID.Value;
            var startTime = query.Date_Time.Value;
            var customerName = $"{query.First_Name} {query.Surname}".Trim().ToLower();

            var appointments = await _db.Appointments
                .Where(a => a.Dentist_ID == dentistId
                    && a.Start_Time == startTime
                    && a.Customer_Date_Of_Birth == query.Date_Of_Birth
                    && a.Customer_Full_Name.ToLower() == customerName)
                .ToListAsync();

            if (appointments.Count > 0)
            {
                _db.Appointments.RemoveRange(appointments);
            }
        }

        [HttpGet("GetDoctorFreeTimes")]
        public async Task<IActionResult> GetDoctorFreeTimes(int doctorID, string date)
        {
            if (!DateTime.TryParse(date, out var selectedDate))
            {
                selectedDate = DateTime.Today;
            }

            var appointments = await _db.Appointments
                .Where(a => a.Dentist_ID == doctorID && a.Start_Time.Date == selectedDate.Date)
                .ToListAsync();
            var busyTimes = appointments.Select(a => new
            {
                Start = a.Start_Time,
                End = a.Start_Time.AddMinutes(a.Duration_mins)
            }).ToList();

            var times = new List<DateTime>();
            var dayStart = selectedDate.Date.AddHours(9);  // 9:00
            var dayEnd = selectedDate.Date.AddHours(17);   // 17:00
            for (var t = dayStart; t.AddMinutes(30) <= dayEnd; t = t.AddMinutes(30))
            {
                var slotEnd = t.AddMinutes(30);
                var conflict = busyTimes.Any(b =>
                    b.Start < slotEnd && b.End > t);
                if (!conflict) times.Add(t);
            }

            return Ok(times);
        }
    }

    public class LoginRequest
    {
        public string Email_Address { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class DentistLoginResponse
    {
        public int ID { get; set; }
        public string First_Name { get; set; } = string.Empty;
        public string Last_Name { get; set; } = string.Empty;
        public string Email_Address { get; set; } = string.Empty;
        public string Phone_Number { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class DentistProfileResponse
    {
        public int ID { get; set; }
        public string First_Name { get; set; } = string.Empty;
        public string Last_Name { get; set; } = string.Empty;
        public string Email_Address { get; set; } = string.Empty;
        public string Phone_Number { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class DentistProfileUpdateRequest
    {
        public string? First_Name { get; set; }
        public string? Last_Name { get; set; }
        public string? Email_Address { get; set; }
        public string? Phone_Number { get; set; }
        public string? Password { get; set; }
    }

    public class DoctorQueryStatusUpdateRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    public class AppointmentUpdateRequest
    {
        public string? Customer_Full_Name { get; set; }
        public int? Customer_Phone_Number { get; set; }
        public string? Customer_Email_Address { get; set; }
        public bool? Completed { get; set; }
        public string? Notes { get; set; }
    }

    public class DoctorQueryResponse
    {
        public int ID { get; set; }
        public string First_Name { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public DateOnly Date_Of_Birth {get; set;} = DateOnly.FromDateTime(DateTime.MinValue);
        public string Email_Address { get; set; } = string.Empty;
        public string Phone_Number { get; set; } = string.Empty;
        public int? Procedure_ID { get; set; }
        public string? Procedure_Name { get; set; }
        public int? Doctor_ID { get; set; }
        public DateTime? Date_Time { get; set; }
        public string? Additional_Information { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class DoctorAppointmentResponse
    {
        public int ID { get; set; }
        public int Dentist_ID { get; set; }
        public DateTime Start_Time { get; set; }
        public int Duration_mins { get; set; }
        public string Customer_Full_Name { get; set; } = string.Empty;
        public DateOnly Customer_Date_Of_Birth { get; set; }
        public int Customer_Phone_Number { get; set; }
        public string Customer_Email_Address { get; set; } = string.Empty;
        public bool Completed { get; set; }
        public string Notes { get; set; } = string.Empty;
        public string? Procedure_Name { get; set; }
    }
}
