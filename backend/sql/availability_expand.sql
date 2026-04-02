-- Expand availability to allow stock counts > 9
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE food_items MODIFY availability NUMBER(5)';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/
