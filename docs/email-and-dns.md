# Open Road email and DNS

Last checked: 4 November 2026.

- Domain: `openroadtechnologies.co.uk`
- DNS provider: Cloudflare.
- Incoming mail routing: the domain's MX record points to `openroadtechnologies-co-uk.mail.protection.outlook.com` (priority 0), a Microsoft 365 / Exchange Online Protection endpoint.

The MX record shows that incoming mail is routed through Microsoft. It does not by itself confirm where every mailbox is hosted or whether mail is subsequently forwarded. Cloudflare manages DNS; it is not the incoming mail endpoint shown by this record.

To check the current record, use [Google's public DNS lookup](https://dns.google/resolve?name=openroadtechnologies.co.uk&type=MX). DNS and mail configuration can change; verify the live records and Microsoft 365 configuration before making changes. Do not store passwords or other secrets in this repository.
