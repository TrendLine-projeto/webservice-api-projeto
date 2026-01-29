ALTER TABLE notas_fiscais
  ADD COLUMN integracao_gmail_xml_id INT NULL
  AFTER lote_id;
