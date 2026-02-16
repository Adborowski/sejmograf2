const getFormattedDate = (dateString) => {
  let formattedDateString;
  const dateObject = new Date(dateString);
  formattedDateString = dateObject.toISOString().slice(0, 19).replace("T", " ");

  return formattedDateString;
};

export default getFormattedDate;
