export interface BmiStatus {
  bmi: number
  color: string
  label: string
  tooltip: string
}

/**
 * Calcula o IMC e devolve cor + rótulo + texto explicativo.
 * Retorna null quando peso ou altura não estão preenchidos.
 * IMC = peso(kg) / altura(m)². Faixas conforme OMS.
 */
export function getBmiStatus(
  weight?: number | null,
  height?: number | null,
): BmiStatus | null {
  if (!weight || !height) return null
  const bmi = weight / Math.pow(height / 100, 2)
  const bmiStr = bmi.toFixed(1)
  if (bmi < 18.5) return {
    bmi,
    color: '#f9c74f',
    label: 'Abaixo do peso',
    tooltip: `IMC ${bmiStr} — Abaixo do peso ideal. Considere aumentar a ingestão calórica com orientação profissional.`,
  }
  if (bmi < 25) return {
    bmi,
    color: 'var(--success)',
    label: 'Faixa saudável',
    tooltip: `IMC ${bmiStr} — Peso dentro da faixa saudável recomendada pela OMS. Continue assim!`,
  }
  if (bmi < 30) return {
    bmi,
    color: 'var(--warn)',
    label: 'Sobrepeso',
    tooltip: `IMC ${bmiStr} — Sobrepeso. Alimentação equilibrada e treino consistente ajudam a atingir o peso ideal.`,
  }
  return {
    bmi,
    color: 'var(--danger)',
    label: 'Obesidade',
    tooltip: `IMC ${bmiStr} — Acima do peso recomendado. Recomenda-se acompanhamento com profissional de saúde.`,
  }
}
