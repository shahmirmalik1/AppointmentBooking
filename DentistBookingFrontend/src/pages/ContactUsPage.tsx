import { useEffect, useState } from "react";
import { getContactInfo } from "../services/APIService";

function ContactUsPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const loadContactDetails = async () => {
      try {
        const data = await getContactInfo(1);

        setEmail(data.email_Address);
        setPhone(data.phone_Number);
      } catch (error) {
        console.error("Failed to load contact details", error);
      }
    };

    loadContactDetails();
  }, []);

  return (
    <div className="page-layout">
      <div className="contact-card">
        <p className="eyebrow">Contact Us</p>
        <h1>We're here to help</h1>
        <p className="card-copy">
          If you have any questions about appointments or dental procedures, please contact us and our friendly team will respond as soon as possible.
        </p>

        <div className="info-box">
          <div>
            <strong>Email</strong>
            <p>{email}</p>
          </div>
          <div>
            <strong>Phone</strong>
            <p>{phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUsPage;