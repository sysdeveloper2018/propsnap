import React from 'react';

const Instructions: React.FC = () => {
  return (
    <div className="bg-sabia-dark p-8 rounded-xl shadow-lg border border-sabia-olive/20 max-w-4xl mx-auto prose prose-invert prose-headings:text-sabia-frost prose-p:text-sabia-silver prose-strong:text-sabia-olive">
      <h1 className="text-3xl font-bold mb-4 text-sabia-frost">PropSnap User Manual</h1>
      
      <p className="lead text-lg text-sabia-silver">PropSnap is a commercial-grade mobile application designed for real estate investors to quickly capture, catalog, and analyze properties in the field.</p>

      <hr className="my-8 border-sabia-olive/20" />

      <h3 className="text-sabia-frost">1. Capturing a New Property</h3>
      <ul className="text-sabia-silver marker:text-sabia-olive">
          <li>Tap the <strong>"New Property"</strong> button (Plus icon) in the bottom navigation bar.</li>
          <li><strong>Take Snapshot:</strong> Tap the Camera icon. Grant camera permissions if asked. Align your shot and tap the shutter button.</li>
          <li><strong>Auto-Locate:</strong> After taking a photo, tap <strong>"Locate"</strong> to use GPS + AI to auto-fill the address.</li>
          <li><strong>Fill Details:</strong> Enter key metrics (Price, Type) and update the status pipeline.</li>
          <li><strong>Save:</strong> Tap "Save Property" to commit to your database.</li>
      </ul>

      <h3 className="text-sabia-frost">2. Dashboard & Management</h3>
      <ul className="text-sabia-silver marker:text-sabia-olive">
          <li>Tap <strong>"Properties"</strong> to view your portfolio grid.</li>
          <li>Use the top bar filters to sort by <strong>Price</strong> or <strong>Date</strong>, and filter by <strong>Type</strong> (Residential, Commercial, etc.).</li>
          <li>Cards display key status indicators and a "View on Map" shortcut.</li>
          <li>
            <strong>Email & Share:</strong> Tap the <span className="inline-block align-middle"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span> <strong>Envelope Icon</strong>.
            <ul className="mt-2 text-sm">
                <li><strong>On Mobile:</strong> Opens the system share menu. You can select your Email app (Gmail, Outlook, etc.) and the <strong>property photo will be attached</strong> automatically along with the text details.</li>
                <li><strong>On Desktop:</strong> Opens your default email client with text details only (images cannot be attached automatically on desktop web).</li>
            </ul>
          </li>
      </ul>

      <h3 className="text-sabia-frost">3. Data Export</h3>
      <p className="text-sabia-silver">Your data resides locally on your device for security and speed.</p>
      <ul className="text-sabia-silver marker:text-sabia-olive">
          <li><strong>Export:</strong> Use the "Download" icon in the header to backup your portfolio to CSV.</li>
          <li><strong>Import:</strong> Use the "Upload" icon to restore data or import leads from external systems.</li>
      </ul>

      <div className="bg-sabia-olive/10 p-4 rounded-lg border border-sabia-olive/30 mt-6">
          <h4 className="text-sabia-olive mt-0">Pro Tips</h4>
          <ul className="text-sabia-silver mb-0 marker:text-sabia-olive">
              <li>Use landscape mode on snapshots for better card visuals.</li>
              <li>Regularly export your CSV to ensure data backup.</li>
              <li>When emailing, you can add multiple recipients in your mail app before sending.</li>
          </ul>
      </div>
    </div>
  );
};

export default Instructions;