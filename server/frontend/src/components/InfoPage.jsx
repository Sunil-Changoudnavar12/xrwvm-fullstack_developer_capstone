import React from "react";
import Header from "./Header/Header";
import profileImage from "./assets/person.png";
import contactImage from "./assets/contactus.png";

const InfoPage = ({ contact = false }) => (
  <>
    <Header />
    <main style={{ maxWidth: 1000, margin: "40px auto", padding: "0 20px", color: "#172b4d" }}>
      <h1>{contact ? "Contact Us" : "About Us"}</h1>
      <p style={{ lineHeight: 1.8, color: "#52647a" }}>
        {contact
          ? "Questions about dealership details, vehicles, or reviews? This capstone demonstration does not provide a staffed support channel."
          : "Dealerships helps people explore locations, vehicle information, and customer reviews in one place."}
      </p>
      {contact ? (
        <>
          <p><strong>Example contact details:</strong> support@example.com (demonstration only)</p>
          <img src={contactImage} alt="Contact support illustration" style={{ width: "100%", maxWidth: 650, borderRadius: 12 }} />
        </>
      ) : (
        <section>
          <h2>Project team</h2>
          <p>Example project roles for this capstone demonstration.</p>
          <img src={profileImage} alt="Example project team profile illustration" style={{ width: 180, borderRadius: 12 }} />
          <p>Planning, development, and quality review.</p>
        </section>
      )}
    </main>
  </>
);

export default InfoPage;
