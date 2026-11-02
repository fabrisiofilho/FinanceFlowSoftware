-- Compatível com esquema 3: mantém regras e ocorrências existentes.
ALTER TABLE recurring_transactions ADD COLUMN monthly_rule TEXT NOT NULL DEFAULT 'calendar_day'
 CHECK(monthly_rule IN ('calendar_day','first_business_day','last_business_day'));
-- Preserva o dia originalmente escolhido, inclusive após fevereiro.
UPDATE recurring_transactions SET day_of_month=CAST(strftime('%d',start_date) AS INTEGER)
 WHERE day_of_month IS NULL AND frequency IN ('monthly','yearly');
