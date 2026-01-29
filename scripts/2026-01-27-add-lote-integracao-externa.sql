ALTER TABLE entrada_lotes
  ADD COLUMN integracaoExterna TINYINT(1) NOT NULL DEFAULT 0
  AFTER loteIniciado;
