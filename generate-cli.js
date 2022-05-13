async function generateConversation(topic) {

    console.log(`Generating conversation for ${topic}`);
  const fillerWords = [
    "agreed",
    "possibly",
    "intentionally",
    "oh my god",
    "oh my gosh",
    "blah blah blah",
  ];

  const openAiLib = require(`openai`);
  const config = new openAiLib.Configuration({
    apiKey: `OPENAI_API_KEY`,
  });
  const openai = new openAiLib.OpenAIApi(config);
  const response = await openai.createCompletion(`text-davinci-002`, {
    prompt: `Create a conversation with atleast 10 parties with the topic of ${topic}`,
    temperature: 0.5,
    max_tokens: 150,
    top_p: 1,
    frequency_penalty: 1,
    presence_penalty: 0,
  });

  const conversationString = response.data.choices[0].text;
  const conversationArray = conversationString.split(`\n`);

  // openai tends to have this format for completions
  /**
   * QUESTION / TASK
   *
   *
   * A1
   * A2
   * ...
   */
  // the next 2 lines just remove the first empty lines, not really neccessary but in some cases the ai actually puts debug info in it
  // honestly dont know why
  conversationArray.shift();
  conversationArray.shift();

  conversationArray.forEach((item, index) => {
    // remove any empty lines
    if (item === ``) {
      conversationArray.splice(index, 1);
    }
  });

  conversationArray.forEach((item, index) => {
    // remove first 3 chars, most of the time they are empty/indicators for parties/people in the conversation
    conversationArray[index] = item.substring(3);
  });

  conversationArray.forEach((item, index) => {
    // split long sentences into multiple, doesnt really effect the realness of the conversation
    // also sometimes the ai decides to put multiple sentences in one line, so yea gotta solve that
    if (item.length > 90) {
      const firstPart = item.substring(0, item.length / 2);
      const secondPart = item.substring(item.length / 2);
      conversationArray.splice(index, 1, firstPart, secondPart);
    }
  });

  conversationArray.forEach((item, index) => {
    // if the substring(3) didnt delete all of the suffix, it is because the ai used "Party: ..." or "Person: ...", so we solve for that
    // doesnt effect anything else because the ai doesnt, in my experience, use ":" in any other way
    if (item.includes(`:`)) {
      conversationArray[index] = item.substring(item.indexOf(`:`) + 1);
      conversationArray[index] = `${index + 1}) ` + conversationArray[index];
    }
  });

  conversationArray.forEach((item, index) => {
    // just for good measure, remove any empty lines again
    if (item === ``) {
      conversationArray.splice(index, 1);
    }
  });

  // if object contains a number followed by a ")", remove it
  conversationArray.forEach((item, index) => {
    if (item.includes(`)`)) {
      conversationArray[index] = item.substring(0, item.indexOf(`)`));
    }
  });

  // add filler words if the char count of any object in conversationArray is under 5
  conversationArray.forEach((item, index) => {
    if (item.length < 5) {
      conversationArray.splice(
        index,
        0,
        fillerWords[Math.floor(Math.random() * fillerWords.length)]
      );
    }
  });

  conversationArray.forEach((item, index) => {
    if (item.length < 5) {
      conversationArray.splice(index, 1);
    }
  });

  // remove any spaces at the end and start of the any object
  conversationArray.forEach((item, index) => {
    conversationArray[index] = conversationArray[index].trim();
  });

  // yes we have to do it like this, because otherwise we always work with the same item, doesnt matter what we do with it

  let formattedConversation = conversationArray;

  if (process.env.DEBUG_CHAT_BOT) {
    console.log(`openai response`);
    console.log(response.data);
    console.log(`conv string`);
    console.log(conversationString);
    console.log(`conv array`);
    console.log(conversationArray);
    console.log(`formatted conv`);
    console.log(formattedConversation);
  }

  recentlyGenned = formattedConversation;

  return {
    success: 1,
    conversation: formattedConversation,
    sentences: formattedConversation.length,
  };
}

let recentlyGenned = [];

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let firstGeneration = true;
let justGenerated = false;

console.log("give me a topic brah\n")

let conversations = [] ;

rl.on('line', function(line){

    if (firstGeneration) {
        firstGeneration = false;
        generateConversation(line).then((res) => {
            console.log(`Topic: ${line} Sentences: ${res.sentences}`);
            console.log(res.conversation);
            console.log(`\n\n`);
            console.log("what do you think?");
            justGenerated = true;
        })
    }

    if (justGenerated) {
        justGenerated = false;

        let args = line.split(" ")

        if (args[0] === "1"){
            console.log("saved");

            conversations.push(recentlyGenned)

            justGenerated = true
        }else if (args[0] === "2"){
            console.log("deleted");
            justGenerated = true
         } else if (args[0] === "3")
            {console.log("regenerating...");
            let topic = line.substring(line.indexOf(" ") + 1);
            generateConversation(topic).then((res) => {
                console.log(`Topic: ${topic} Sentences: ${res.sentences}`);
                console.log(res.conversation);
                console.log(`\n\n`);
                console.log("what do you think?");
                justGenerated = true;
            })
        } else if (args[0] === "4") {
          conversations.forEach(conv => conv.forEach(sentence => console.log(sentence)))
          conversations = [];
          justGenerated = true;
        } else {

          justGenerated = true;
          
        }
        console.log("\ngive me a topic brah\n");
        return;
    }
})