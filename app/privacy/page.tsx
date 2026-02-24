'use client';

import { NavBar } from '@/components/layout/NavBar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar backHref="/" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 prose prose-sm max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Polityka Prywatności</h1>
          <p className="text-sm text-gray-500 mb-6">Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Administrator danych</h2>
            <p className="text-gray-700 mb-2">
              Administrator danych osobowych (dalej: „Administrator") w rozumieniu Rozporządzenia (UE) 2016/679 Parlamentu Europejskiego i Rady z dnia 27 kwietnia 2016 r. (RODO):
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="font-semibold text-gray-900 mb-1">Adam Borowski Digital</p>
              <p className="text-gray-700 mb-1">NIP: 5242955372</p>
              <p className="text-gray-700 mb-1">Kraj: Polska</p>
              <p className="text-gray-700">Email: <a href="mailto:kontakt@sejmograf.pl" className="text-blue-600 hover:underline">kontakt@sejmograf.pl</a></p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Jakie dane zbieramy</h2>
            <p className="text-gray-700 mb-3">
              W ramach korzystania z serwisu Sejmograf (dalej: „Serwis") zbieramy następujące kategorie danych osobowych:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>Dane uwierzytelniające:</strong> adres e-mail i hasło (w formie skrótu) — podczas rejestracji i logowania</li>
              <li><strong>Opinie użytkowników:</strong> treść opinii i ocenSubmitowanych przez użytkowników</li>
              <li><strong>Dane sesji:</strong> identyfikatory sesji przechowywane w ciasteczku sesji (cookies)</li>
            </ul>
            <p className="text-gray-700">
              Nie zbieramy danych lokalizacyjnych, danych o przeglądaniu stron trzecich ani żadnych innych danych wrażliwych, chyba że wyraźnie się na to godzisz.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Cel i podstawa prawna przetwarzania</h2>
            <p className="text-gray-700 mb-3">
              Przetwarzamy Twoje dane osobowe w następujących celach:
            </p>
            <ul className="space-y-4 text-gray-700">
              <li>
                <strong>Świadczenie usługi:</strong> realizacja umowy o świadczenie usług Serwisu (art. 6 ust. 1 lit. b RODO) — autentykacja, przechowywanie opinii, dostęp do zawartości
              </li>
              <li>
                <strong>Bezpieczeństwo:</strong> ochrona bezpieczeństwa, zapobieganie oszustwom i nadużyciom (art. 6 ust. 1 lit. f RODO — uzasadniony interes)
              </li>
              <li>
                <strong>Wypełnienie obowiązków prawnych:</strong> jeśli wymagane przez prawo (art. 6 ust. 1 lit. c RODO)
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Okres przechowywania danych</h2>
            <p className="text-gray-700 mb-3">
              Dane osobowe przechowujemy przez okres:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Czasu trwania Twojego konta — dopóki je nie usuniesz</li>
              <li>Opinie i komentarze: przechowujemy do czasu żądania usunięcia lub usunięcia konta</li>
              <li>Logi dostępu i sesje: do 90 dni od ostatniego logowania (ze względów bezpieczeństwa)</li>
              <li>Po zakończeniu konta: do 30 dni, chyba że prawo wymaga dłuższego przechowywania</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Twoje prawa</h2>
            <p className="text-gray-700 mb-3">
              Masz następujące prawa w odniesieniu do swoich danych osobowych:
            </p>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li><strong>Prawo dostępu:</strong> możesz żądać kopii swoich danych</li>
              <li><strong>Prawo do sprostowania:</strong> możesz poprosić o sprostowanie nieprawidłowych danych</li>
              <li><strong>Prawo do usunięcia:</strong> możesz żądać usunięcia swoich danych (prawo do bycia zapomnianym)</li>
              <li><strong>Prawo do ograniczenia przetwarzania:</strong> możesz żądać ograniczenia przetwarzania danych</li>
              <li><strong>Prawo do przenoszenia danych:</strong> możesz otrzymać swoje dane w ustrukturyzowanym formacie</li>
              <li><strong>Prawo do sprzeciwu:</strong> możesz sprzeciwić się przetwarzaniu danych w określonych celach</li>
            </ul>
            <p className="text-gray-700 mt-4">
              W celu realizacji powyższych praw skontaktuj się z nami na adres <a href="mailto:kontakt@sejmograf.pl" className="text-blue-600 hover:underline">kontakt@sejmograf.pl</a>.
            </p>
            <p className="text-gray-700 mt-4">
              Masz również prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (UODO).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Ciasteczka (Cookies)</h2>
            <p className="text-gray-700 mb-3">
              Serwis używa następujących ciasteczek:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li>
                <strong>Ciasteczko sesji (Firebase):</strong> przechowuje identyfikator sesji umożliwiający pozostanie w zalogowanym stanie. Jest niezbędne do korzystania z Serwisu.
              </li>
              <li>
                <strong>Ciasteczka analityczne:</strong> jeśli włączone, pomagają nam zrozumieć sposób korzystania z Serwisu
              </li>
            </ul>
            <p className="text-gray-700 mt-4">
              Ciasteczka możesz usunąć za pośrednictwem ustawień przeglądarki. Usunięcie ciasteczka sesji spowoduje wylogowanie.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Bezpieczeństwo danych</h2>
            <p className="text-gray-700">
              Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony Twoich danych osobowych przed nieuprawnionym dostępem, zmianą lub zniszczeniem. Hasła są przechowywane w postaci skrótu kryptograficznego i nigdy nie są przechowywane w postaci zwykłego tekstu.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Podmioty trzecie</h2>
            <p className="text-gray-700 mb-3">
              Twoje dane mogą być udostępniane następującym podmiotom:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Firebase (Google Cloud):</strong> usługa do przechowywania danych i autentykacji — dane przetwarzane zgodnie z warunkami usługi Firebase</li>
              <li><strong>Vercel (hosting):</strong> infrastruktura aplikacji — przetwarzają dane w imieniu Administratora</li>
              <li><strong>Sądy i organy władzy:</strong> jeśli wymagane przez prawo</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Firebase i Vercel są certyfikowane w ramach Standard Umowy Handlowej (SCC) lub posiadają inne gwarancje transferu danych międzynarodowych.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Zmiany polityki prywatności</h2>
            <p className="text-gray-700">
              Zastrzegamy sobie prawo do zmiany niniejszej polityki prywatności. Wszelkie zmiany będą publikowane na tej stronie wraz z datą ostatniej aktualizacji. Ciągłe korzystanie z Serwisu po wprowadzeniu zmian będzie oznaczać Twoją zgodę na zmienioną politykę.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Kontakt</h2>
            <p className="text-gray-700 mb-3">
              W przypadku pytań dotyczących niniejszej polityki prywatności lub przetwarzania Twoich danych osobowych, skontaktuj się z nami:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">Email: <a href="mailto:kontakt@sejmograf.pl" className="text-blue-600 hover:underline">kontakt@sejmograf.pl</a></p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
