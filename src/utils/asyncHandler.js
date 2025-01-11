// this is one way of creating asyncHandler using promises.
// very IMPOTANY TO UNDERSTAND. VERY USEFULL PRODUCTION UTILITY
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err)=>next(err))
  };
};


export { asyncHandler };

// other way using try catch

// below syntax is using Heigher order function.

// const asyncHandler2 = (requestHandlet) => async () => {
//   try {
//     await requestHandlet(req, res, next);
//   } catch (error) {
//     (err) => {
//       next(err);
//     };
//   }
// };
