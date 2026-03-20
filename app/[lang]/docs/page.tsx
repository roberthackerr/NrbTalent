// documentation des nrbtalents 
export default function DocsPage() {
  return (
       <div className="container">
        <div>
      <h1>NRBTalents Email Service Documentation</h1>
      <p>Welcome to the NRBTalents Email Service API documentation. This service allows you to send transactional emails using predefined templates.</p>
      
      <h2>Base URL</h2>
      <p>The base URL for all endpoints is: <code>http://localhost:{process.env.EMAIL_SERVICE_PORT || 3000}/api/email</code></p>
      
      <h2>Endpoints</h2>
      <ul>
        <li><strong>POST /send</strong>: Send a custom email.</li>
        <li><strong>POST /send-template</strong>: Send an email using a predefined template.</li>
        <li><strong>GET /templates</strong>: Retrieve a list of available email templates.</li>
        <li><strong>POST /verify</strong>: Verify the SMTP connection.</li> 
        <li><strong>GET /health</strong>: Check the health status of the email service.</li>
        </ul>   
        <h2>Authentication</h2> 
        <p>This service does not require authentication for its endpoints. Ensure that it is deployed in a secure environment.</p>
      </div>
       </div> 
    
      )
      }                                                                                                       