# Privacy Policy

**Application:** PraxisOS
**Publisher:** Lioua-Kyto ("we", "us")
**Contact:** liwaazeddam@gmail.com
**Effective date:** 12 August 2026
**Version:** 1.1

---

## 1. Summary

PraxisOS is a local-first desktop application. Everything you enter stays on
your own computer, in a database file inside your operating system's per-user
application data folder.

**We operate no servers, hold no accounts, and receive none of your data.** We
could not read your notes, workouts, meals, finances or journal entries even if
asked to, because they never leave your machine.

## 2. Data you create

The application stores the following on your device, and only on your device:

- tasks, courses and their status
- workouts, exercises, logged sets and any photos or videos you attach
- meals, hydration and nutrition figures
- focus sessions and their categories
- budget categories and transactions
- habits and their check-ins
- journal entries and quick notes, including images you paste in
- your settings, themes and window preferences

This data is written to a SQLite database and a `media` folder inside your user
data directory:

| Platform | Location |
| --- | --- |
| Windows | `%APPDATA%\praxisos\` |
| macOS | `~/Library/Application Support/praxisos/` |
| Linux | `~/.config/praxisos/` |

You can open, copy, move, back up or delete these files yourself at any time. We
have no ability to access, recover or delete them for you.

## 3. Data we collect

**None.**

There is no analytics, no telemetry, no crash reporting, no advertising
identifier, no usage statistics, and no account system. The application does not
transmit your content anywhere.

This section is about the **desktop application**. Our public website,
`praxisos.deviumx.com`, is a separate thing and does use analytics; it is
described on its own in section 10.

## 4. Network connections

PraxisOS is designed to work fully offline. It makes network requests in only
two situations, both of which you can avoid:

**a) Update check.** On launch, the application asks the GitHub Releases API
whether a newer version has been published:

`https://api.github.com/repos/Lioua-Kyto/PraxisOS/releases/latest`

This request sends no personal data and no content from your database. As with
any HTTP request, GitHub will see your IP address and a generic user agent.
GitHub's handling of that is governed by the
[GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).
If the request fails, the application carries on silently.

**b) Links you click.** Opening a course link, a release page, or any other link
hands the address to your default browser. From that point your browser and the
destination site apply, not this policy.

**c) Fonts.** The interface loads its typefaces from Google Fonts. Your browser
engine will contact `fonts.googleapis.com` and `fonts.gstatic.com` for those
files. No content or identifier from the application is included.

If you block PraxisOS at your firewall, every feature except the update check
continues to work.

## 5. Backups you export

The export feature writes a `.json` file to a location you choose. That file
contains **all** of your data in plain, readable text. Once written, it is an
ordinary file under your control:

- it is not encrypted;
- it is not uploaded anywhere;
- anyone who can read the file can read your data.

If you store a backup in a cloud folder, email it, or put it on a shared drive,
you are disclosing that data to whoever operates that service. Please treat
backups the way you would treat any other sensitive document.

## 6. Children

PraxisOS is not directed at children under 13 and collects no data from anyone,
including children.

## 7. Your rights

Because we hold none of your data, there is nothing for us to disclose, correct,
export or erase on your behalf. You exercise these rights directly:

- **Access and portability** — use *Settings → Export backup*.
- **Erasure** — delete the user data folder listed in section 2, or uninstall the
  application and remove that folder.

## 8. Security

Your data is protected by your operating system's user account permissions. The
database is not separately encrypted. If other people can log into your computer
under your account, or if your disk is unencrypted and the machine is lost, they
can read it. We recommend enabling full-disk encryption (BitLocker, FileVault,
LUKS) if the data matters to you.

## 9. Third parties

PraxisOS is built on open-source components (Electron, Chromium, Node.js, React,
SQLite and others). These run locally as part of the application and do not
transmit your data. No third party receives information about you from us,
because we have none to give.

## 10. The PraxisOS website (praxisos.deviumx.com)

This section applies **only to the marketing website** at
`praxisos.deviumx.com`. It changes nothing above: the desktop application still
collects nothing and still transmits none of your content.

The website uses two analytics services to understand how visitors use the page
so we can improve it:

- **Google Analytics 4** (Google) provides anonymized site-visit analytics and
  session navigation data.
- **Microsoft Clarity** (Microsoft) provides heatmaps and anonymized session
  navigation data.

Through these services the website collects:

- anonymized site-visit analytics, heatmaps and session navigation data;
- specific UI interactions, such as clicks on the application **Download**
  buttons.

All of this relies on cookies, and every cookie is governed by the Consent Mode
v2 banner shown on your first visit. Storage is **denied by default**: nothing
is stored and no analytics cookie is set until you press **Accept**. Press
**Decline**, or ignore the banner, and tracking storage stays off. You can
withdraw consent at any time by clearing this site's data in your browser, which
brings the banner back.

Whatever these services do receive (such as your IP address and a generic user
agent) is handled under Google's and Microsoft's own privacy terms, not this
policy.

## 11. Changes to this policy

If this policy changes, the revised version will be published in the project
repository with a new effective date, and material changes will be noted in the
release notes. Continued use after a change means you accept the revised policy.

## 12. Contact

Questions about this policy: **liwaazeddam@gmail.com**
