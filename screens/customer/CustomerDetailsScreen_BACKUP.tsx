// BACKUP FILE - This is a clean version of the corrupted functions

// Clean fetchQuotations function
const fetchQuotations = async (customerIdentifier: string) => {
    const id = instanceId.current;
    console.log(`📋 [${id}] fetchQuotations START — identifier: "${customerIdentifier}" | isMounted: ${isMounted.current}`);
    setLoadingQuotations(true);

    try {
        // Strategy 1: Try getCustomerQuotations first
        const response1 = await getCustomerQuotations(customerIdentifier);

        let quotationsData = response1.data?.response?.data || response1.data?.data || response1.data;

        if (!Array.isArray(quotationsData) && response1.data?.response) {
            quotationsData = response1.data?.response;
        }

        if (!Array.isArray(quotationsData) && Array.isArray(response1.data?.data)) {
            quotationsData = response1.data?.data;
        }

        console.log(`✅ [${id}] Strategy 1 SUCCESS — ${quotationsData.length} quotations | isMounted: ${isMounted.current}`);
        if (Array.isArray(quotationsData) && quotationsData.length > 0) {
            if (!isMounted.current) return;
            setQuotations(quotationsData);
            setLoadingQuotations(false);
            return;
        } else if (Array.isArray(quotationsData) && quotationsData.length === 0) {
            if (!isMounted.current) return;
            setQuotations([]);
            setLoadingQuotations(false);
            return;
        }

        console.log(`📋 [${id}] Strategy 2 — calling getQuotationByCustomerId`);
        // Strategy 2: Try getQuotationByCustomerId
        const response2 = await getQuotationByCustomerId(customerIdentifier);
        console.log(`📋 [${id}] Strategy 2 response:`, { status: response2?.status });
        quotationsData = response2.data?.response?.data || response2.data?.data || response2.data;

        if (Array.isArray(quotationsData) && quotationsData.length > 0) {
            if (!isMounted.current) return;
            setQuotations(quotationsData);
            setLoadingQuotations(false);
            return;
        }
        console.log(`📋 [${id}] Strategy 3 — calling searchQuotations`);

        // Strategy 3: Try searchQuotations
        const response3 = await searchQuotations({
            module: 'customer',
            column: 'customerId',
            searchString: customerIdentifier,
            size: 100,
            page: 1
        });
        quotationsData = response3.data?.response?.data || response3.data?.data || response3.data;

        if (Array.isArray(quotationsData) && quotationsData.length > 0) {
            if (!isMounted.current) return;
            setQuotations(quotationsData);
            setLoadingQuotations(false);
            return;
        }

        if (!isMounted.current) return;
        setQuotations([]);
        setLoadingQuotations(false);

    } catch (error) {
        console.error(`❌ [${id}] fetchQuotations ERROR:`, error instanceof Error ? error.message : error);
        if (!isMounted.current) return;
        setQuotations([]);
    } finally {
        if (!isMounted.current) return;
        setLoadingQuotations(false);
    }
};

// Clean useEffect for data loading
useEffect(() => {
    const loadData = async () => {
        if (!isMounted.current) return;
        await fetchCustomerData();
        if (!isMounted.current) return;
        await fetchCountries();
    };
    loadData();
}, [customerId]);
