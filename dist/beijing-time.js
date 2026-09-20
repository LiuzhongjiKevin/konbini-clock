export function beijingTime(date=new Date()) {
  const shifted=new Date(date.getTime()+8*3600000),hour=shifted.getUTCHours();
  return {phase:hour<6||hour>=19?'night':hour<11?'morning':hour<16?'noon':'dusk',clock:`${String(hour).padStart(2,'0')}:${String(shifted.getUTCMinutes()).padStart(2,'0')}`};
}
