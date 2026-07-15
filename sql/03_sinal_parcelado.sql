-- Sinal parcelado: quando o sinal é pago em mais de uma parcela (sempre
-- mensais), guarda a flag e a quantidade de parcelas. O valor por parcela é o
-- valor_sinal dividido pela quantidade (calculado no Contratos). O parcelamento
-- do sinal é independente e não altera o início das parcelas mensais.
alter table propostas
  add column if not exists sinal_parcelado boolean default false,
  add column if not exists sinal_quantidade_parcelas int;
