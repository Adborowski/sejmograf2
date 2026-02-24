import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    // Validation
    if (!name || !email || !message) {
      return Response.json(
        { error: 'Wszystkie pola są wymagane' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: 'Podaj prawidłowy adres e-mail' },
        { status: 400 }
      );
    }

    // Message length validation
    if (message.length > 2000) {
      return Response.json(
        { error: 'Wiadomość nie może być dłuższa niż 2000 znaków' },
        { status: 400 }
      );
    }

    // Send email via Resend
    const data = await resend.emails.send({
      from: 'Formularz Kontaktowy <kontakt@sejmograf.pl>',
      to: 'kontakt@sejmograf.pl',
      replyTo: email,
      subject: `[Sejmograf] Wiadomość od ${name}`,
      text: `Imię i nazwisko: ${name}\nAdres e-mail: ${email}\n\nWiadomość:\n${message}`,
    });

    if (data.error) {
      console.error('Resend error:', data.error);
      return Response.json(
        { error: 'Nie udało się wysłać wiadomości. Spróbuj ponownie.' },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, id: data.data?.id }, { status: 200 });
  } catch (error) {
    console.error('Contact form error:', error);
    return Response.json(
      { error: 'Błąd serwera. Spróbuj ponownie.' },
      { status: 500 }
    );
  }
}
