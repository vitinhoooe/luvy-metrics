// As telas de prévia (dados de exemplo) existem em desenvolvimento.
// Em produção, só aparecem se LUVY_PREVIA=1 (para mostrar o produto sem banco). No site real, fica desligado.
export const previaLiberada = () => process.env.NODE_ENV !== 'production' || process.env.LUVY_PREVIA === '1'
