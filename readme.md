time to get a res????!?!?

this resy bot is as no-frills as it gets and uses `k6` (traditionally a performance-testing framework) to spam resy with requests.

how to:
    - clone this repository
    - run `npm i` in the terminal (or install `npm` first if needed)
    - run `brew install k6` in the terminal
    - rename `env-template.json` to `env.json`. The following fields will need to be replaced. See the section below for doing this.
        - venue_id
        - payment_method
        - api_key
        - auth_token
        - universal_token
    - Run `k6 run perf.js`. If the reservation is successful, you should see an object with a `resy_token` and `reservation_id` appear in the console.


how to find env variables:
    finding these values can be done without too much hassle:
        1. go to a restaurant that charges for a res (like saga here: https://resy.com/cities/new-york-ny/venues/saga-ny)
        2. inspect element on chrome and open network tab
        3. refresh the page, then filter for a request called "find". it should look like this: "find?lat=0&long=0&day=2024-08-05&party_size=2&venue_id=52855"
            a. click it.
            b. if you're looking for a specific venue, the number after `venue_id` is your venue_id.
            c. in the "Headers" tab that opens up, look for the header called "Authorization", with value `ResyAPI api_key="YOUR_API_KEY"`.
            d. copy your API key (just within the quotes, not the ResyAPI part) and paste into the `env.json`.
            e. find the headers `x-resy-auth-token` and `x-resy-universal-auth`. These should have the same value. Copy these into your `env.json` as well.
        4. Now click on an open time slot on the restaurant. You don't have to actually book the reservation, but a dialog should pop up with a book button.
            a. filter for a new request called "details". It should have a status of 201. Click it.
            b. Click the "Preview" tab on the right, which should open a JSON-looking object.
            c. find and expand "user" and inside that, "payment_methods". Copy the number after `id` in the first object that pops up. this is your `payment_method`. 



limitations:
    - don't get to pick when during the day to make the res
    - i haven't automated the script to wait until the time rezzies come up to shoot its shot; ie you gotta run it AT the time rezzies come out


recipe for success:
    - each "iteration" takes about one second
    - therefore, the idea is to use a handful of iterations (too many will likely get you banned) probably a second before the rezzies are available
    - i haven't fine-tuned it to work extremely quickly-- i can if this bot isn't fast enough
