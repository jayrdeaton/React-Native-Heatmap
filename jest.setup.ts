// Suppress unhandled promise rejections from test noise
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in test:', reason)
})
