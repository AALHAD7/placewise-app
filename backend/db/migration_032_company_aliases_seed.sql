-- Phase 1.5 item 4: seeded for every company in the Company dropdown
-- (frontend-react/src/lib/constants.ts's POPULAR_COMPANIES) plus every
-- company confirmed to actually appear in the ingested casebook corpus
-- (checked live via a document_chunks scan - see the Phase 1.5 report).
-- "alias" is always the match target (including the canonical name itself,
-- so matching code never special-cases "canonical vs alias").
insert into company_aliases (canonical_name, alias) values
  ('Razorpay', 'Razorpay'),
  ('PhonePe', 'PhonePe'),
  ('PhonePe', 'Phone Pe'),
  ('Flipkart', 'Flipkart'),
  ('Swiggy', 'Swiggy'),
  ('Zomato', 'Zomato'),
  ('Zerodha', 'Zerodha'),
  ('McKinsey & Company', 'McKinsey & Company'),
  ('McKinsey & Company', 'McKinsey'),
  ('McKinsey & Company', 'McKinsey and Company'),
  ('Hindustan Unilever', 'Hindustan Unilever'),
  ('Hindustan Unilever', 'HUL'),
  ('Hindustan Unilever', 'Hindustan Unilever Limited'),
  ('Amazon India', 'Amazon India'),
  ('Amazon India', 'Amazon'),
  ('Boston Consulting Group', 'Boston Consulting Group'),
  ('Boston Consulting Group', 'BCG'),
  ('Bain & Company', 'Bain & Company'),
  ('Bain & Company', 'Bain'),
  ('Bain & Company', 'Bain and Company'),
  ('Tata Consultancy Services', 'Tata Consultancy Services'),
  ('Tata Consultancy Services', 'TCS'),
  ('Infosys', 'Infosys'),
  ('Goldman Sachs', 'Goldman Sachs'),
  ('Goldman Sachs', 'Goldman'),
  ('Ernst & Young', 'Ernst & Young'),
  ('Ernst & Young', 'EY'),
  ('Ernst & Young', 'Ernst and Young'),
  ('HDFC Bank', 'HDFC Bank'),
  ('HDFC Bank', 'HDFC'),
  ('ICICI Bank', 'ICICI Bank'),
  ('ICICI Bank', 'ICICI'),
  ('Deloitte', 'Deloitte'),
  ('Accenture', 'Accenture'),
  
  ('KPMG', 'KPMG'),
  ('PwC', 'PwC'),
  ('PwC', 'PricewaterhouseCoopers')
on conflict (alias) do nothing;