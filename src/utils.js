export function dateformate(dateObj){
    const date = new Date(dateObj);
    let shortMonth = date.toLocaleString('en-us', { month: 'short' })
    let monthDay = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes()

    console.log('shortMonth:::', shortMonth, 'monthDay::', monthDay)

    return `${shortMonth},${monthDay} ${hours}:${minutes}`
}