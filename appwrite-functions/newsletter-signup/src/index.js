import { Client, TablesDB, ID } from 'node-appwrite';
import { Resend } from 'resend';

export default async ({ req, res, log, error }) => {
  // Validate request method
  if (req.method !== 'POST') {
    return res.json({ success: false, message: 'Method Not Allowed' }, 405);
  }

  // Parse payload
  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    error('Failed to parse request body: ' + err.message);
    return res.json({ success: false, message: 'Invalid request body' }, 400);
  }

  const { email, firstName, lastName, source, teamId } = payload;

  if (!email || !teamId) {
    return res.json({ success: false, message: 'Email and teamId are required' }, 400);
  }

  // Initialize Appwrite Client with API Key (Service Role)
  // Ensure least privilege by using a key with ONLY databases.write scope for this specific database
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const tablesDB = new TablesDB(client);
  const databaseId = 'leadwave-main';

  // Initialize Resend
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // 1. Check if user already exists
    // We use Server SDK, so we bypass team permissions to check if the email exists globally or for this team
    // Alternatively, we let the DB unique index handle it and catch the 409
    
    let subscriber;
    try {
      subscriber = await tablesDB.createRow({
        databaseId,
        tableId: 'newsletter_subscribers',
        rowId: ID.unique(),
        data: {
          email,
          status: 'subscribed',
          firstName: firstName || '',
          lastName: lastName || '',
          source: source || 'api',
          teamId
        },
        permissions: [
          // Use least privilege for created records
          `read("team:${teamId}")`,
          `update("team:${teamId}","admin")`,
          `delete("team:${teamId}","owner")`
        ]
      });
      log(`Created new subscriber: ${subscriber.$id}`);
    } catch (dbError) {
      if (dbError.code === 409) {
        // Already exists
        return res.json({ success: false, message: 'Email already subscribed' }, 409);
      }
      throw dbError;
    }

    // 2. Send Welcome Email via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { data, error: resendError } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'newsletter@yourdomain.com',
          to: email,
          subject: 'Welcome to our Newsletter!',
          html: `<p>Hi ${firstName || 'there'},</p><p>Thanks for subscribing to our newsletter! We are excited to have you on board.</p>`
        });

        if (resendError) {
          error('Resend error: ' + JSON.stringify(resendError));
          // We still return success for the subscription, but log the email failure
          log('Subscription successful, but welcome email failed');
        } else {
          log('Welcome email sent: ' + JSON.stringify(data));
        }
      } catch (emailError) {
        error('Failed to send email: ' + emailError.message);
      }
    } else {
      log('RESEND_API_KEY not configured, skipping welcome email');
    }

    return res.json({
      success: true,
      message: 'Successfully subscribed',
      subscriberId: subscriber.$id
    });
  } catch (err) {
    error('Server error: ' + err.message);
    return res.json({ success: false, message: 'Internal Server Error' }, 500);
  }
};
