<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <cr-loader :isLoading="isLoading" />
    <div class="container">
      <cr-add-ticker
        @add-ticker="addNewTicker"
        :allTickers="allTickers"
        :showError="showError"
        @reset-validation="showError = null"
      />
      <template v-if="filteredList.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <input
          v-model="searchQuery"
          type="text"
          name="filter"
          class="block pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
          placeholder="Filter your tickers"
        />
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="tickerItem in paginatedTickersList"
            :key="tickerItem"
            @click="selectTicker(tickerItem)"
            class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
            :class="{
              'border-4': selectedTicker?.name === tickerItem.name,
              'bg-red-200': tickerItem.error,
            }"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ tickerItem.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ tickerItem.price }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              @click.stop="removeTicker(tickerItem)"
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path></svg
              >Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
        <div class="flex justify-between">
          <button
            v-if="page > 1"
            @click="page = page - 1"
            class="flex max-w-xs items-center justify-center font-medium bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
          >
            Previous
          </button>
          <button
            v-if="page < pageSize"
            @click="page = page + 1"
            class="flex max-w-xs items-center justify-center font-medium bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none ml-auto"
          >
            Next
          </button>
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>

      <cr-graph
        :graph="graph"
        @close-graph="selectedTicker = null"
        :selectedTicker="selectedTicker"
      />
    </div>
  </div>
</template>

<script>
import { subscribeToTickerUpdates, getAllTickers } from "./api";
import CrLoader from "./components/CrLoader.vue";
import CrAddTicker from "./components/CrAddTicker.vue";
import CrGraph from "./components/CrGraph.vue";
const TICKER_PER_PAGE = 6;
export default {
  components: {
    CrLoader,
    CrAddTicker,
    CrGraph,
  },
  data() {
    return {
      tickerList: [],
      isLoading: false,
      showError: false,
      selectedTicker: null,
      allTickers: [],
      graph: [],
      page: 1,
      pageSize: 1,
      searchQuery: "",
      filteredList: [],
    };
  },
  methods: {
    selectTicker(tickerItem) {
      if (tickerItem.error) {
        return;
      }
      this.selectedTicker = tickerItem;
    },

    addNewTicker(ticker) {
      this.validateTicker(ticker);
      if (this.showError) {
        return;
      }
      if (ticker) {
        const newTicker = {
          name: ticker,
          price: "-",
        };
        this.tickerList = [...this.tickerList, newTicker];
        this.filteredList = [...this.tickerList];

        const currentTicker = this.tickerList[this.tickerList.length - 1];
        this.subscribeTickerToUpdate(currentTicker);
      }
    },

    removeTicker(tickerToRemove) {
      this.tickerList = this.tickerList.filter(
        (ticker) => ticker.name !== tickerToRemove.name
      );
      this.filteredList = this.filteredList.filter(
        (ticker) => ticker.name !== tickerToRemove.name
      );
      if (
        this.selectedTicker &&
        tickerToRemove.name === this.selectedTicker.name
      ) {
        this.selectedTicker = null;
      }
    },

    clearError() {
      this.showError = false;
    },

    validateTicker(ticker) {
      this.tickerList.forEach((tickerItem) => {
        if (tickerItem.name.toLowerCase() === ticker.toLowerCase()) {
          this.showError = true;
        }
      });
    },

    getAllTickers() {
      this.isLoading = true;
      getAllTickers().then((tickers) => {
        this.allTickers = tickers;
        this.isLoading = false;
      });
    },

    subscribeTickerToUpdate(tickerToSubscribe) {
      const updatePrice = (price) => {
        tickerToSubscribe.price =
          price["USD"] > 1
            ? price["USD"].toFixed(2)
            : price["USD"].toPrecision(2);

        if (tickerToSubscribe.name === this.selectedTicker?.name) {
          this.graph.push(this.selectedTicker.price);
        }
      };

      const handleCoinsWithoutExchange = () => {
        tickerToSubscribe.price = "-";
        tickerToSubscribe.error = true;
      };
      subscribeToTickerUpdates(
        tickerToSubscribe.name,
        updatePrice,
        handleCoinsWithoutExchange
      );
    },
  },

  mounted() {
    this.getAllTickers();
    this.tickerList = JSON.parse(localStorage.getItem("cryptonomicon"));
    this.tickerList.forEach((tickerItem) => {
      this.subscribeTickerToUpdate(tickerItem);
    });

    this.filteredList = [...this.tickerList];
  },

  watch: {
    searchQuery() {
      window.history.pushState(
        {},
        "",
        window.location.origin +
          "?search=" +
          this.searchQuery +
          "&page=" +
          this.page
      );
      this.filteredList = this.tickerList.filter((tickerItem) =>
        tickerItem.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
    selectedTicker() {
      this.graph = [];
    },

    tickerList() {
      this.pageSize = Math.ceil(this.tickerList.length / TICKER_PER_PAGE);
      localStorage.setItem("cryptonomicon", JSON.stringify(this.tickerList));
    },

    page() {
      window.history.pushState(
        {},
        "",
        window.location.origin +
          "?search=" +
          this.searchQuery +
          "&page=" +
          this.page
      );
    },
  },

  computed: {
    paginatedTickersList() {
      return this.tickerList.slice(
        this.page * TICKER_PER_PAGE - TICKER_PER_PAGE,
        this.page * TICKER_PER_PAGE
      );
    },
  },
};
</script>

<style src="./assets/app.css"></style>
